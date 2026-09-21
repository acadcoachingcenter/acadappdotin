// worker/src/weeklyMockTest.js
// Phase 3: automated weekly mock test generation, triggered by a Cloudflare
// Cron Trigger (see wrangler.toml) every Wednesday 10:00 AM IST. Generates a
// fresh NEET-pattern and JEE-pattern question set via Groq, saves both as
// MockTest rows, and emails students + tutors a link to solve them.
import { invokeLLM } from "./llm.js";
import { filterEntity, createEntity } from "./entities.js";
import { sendEmailViaResend } from "./email.js";

const QUESTIONS_PER_SUBJECT = 9; // 3 subjects x 9 = 27, close to the 25-30 target

const EXAM_CONFIGS = [
  { examType: "NEET", subjects: ["Physics", "Chemistry", "Biology"] },
  { examType: "JEE", subjects: ["Physics", "Chemistry", "Mathematics"] },
];

const QUESTION_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          correct_index: { type: "integer", minimum: 0, maximum: 3 },
          explanation: { type: "string" },
          subject: { type: "string" },
        },
        required: ["question", "options", "correct_index", "subject"],
      },
    },
  },
  required: ["questions"],
};

async function generateExamQuestions(env, { examType, subjects }) {
  const prompt =
    `Generate ${QUESTIONS_PER_SUBJECT} fresh, original multiple-choice questions for each of these ` +
    `subjects: ${subjects.join(", ")}. These are for a weekly practice mock test for Indian ` +
    `Class 11-12 students preparing for the ${examType} entrance exam. Match the ${examType} ` +
    `question style and difficulty (NCERT-aligned syllabus). Each question needs exactly 4 options, ` +
    `a correct_index (0-3), a one-sentence explanation, and the subject it belongs to. ` +
    `Do not reuse well-known past-year exam questions verbatim -- write original questions testing ` +
    `the same concepts. Spread questions evenly across the given subjects.`;

  const result = await invokeLLM(env, { prompt, response_json_schema: QUESTION_SCHEMA });
  return result.questions || [];
}

function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
}

function buildNotificationEmail({ weekOf, createdTests }) {
  const listItems = createdTests
    .map((t) => `<li><strong>${t.exam_type} Weekly Mock Test</strong> — ${t.question_count} questions</li>`)
    .join("");

  return {
    subject: `New Weekly Mock Test Available — ${weekOf}`,
    html: `
      <p>Hi,</p>
      <p>This week's mock tests are ready:</p>
      <ul>${listItems}</ul>
      <p>Log in to your ACAD dashboard and open <strong>Weekly Mock Test</strong> from the menu to attempt it.</p>
      <p>— ACAD Coaching Center</p>
    `,
  };
}

export async function runWeeklyMockTestJob(env) {
  const weekOf = todayISO();
  const createdTests = [];

  for (const config of EXAM_CONFIGS) {
    try {
      const questions = await generateExamQuestions(env, config);
      if (!questions.length) {
        console.error(`Weekly mock test: Groq returned 0 questions for ${config.examType}`);
        continue;
      }

      const mockTest = await createEntity(
        env,
        "MockTest",
        {
          title: `${config.examType} Weekly Mock Test — ${weekOf}`,
          duration_minutes: String(questions.length * 2), // ~2 min/question, same convention as existing TEXT-typed columns
          total_marks: String(questions.length),
          difficulty: "Moderate",
          questions: JSON.stringify(questions),
          exam_type: config.examType,
          status: "published",
          week_of: weekOf,
        },
        null
      );

      createdTests.push({ ...mockTest, exam_type: config.examType, question_count: questions.length });
    } catch (err) {
      // One exam type failing (e.g. a transient Groq error) shouldn't block the other.
      console.error(`Weekly mock test generation failed for ${config.examType}:`, err);
    }
  }

  if (createdTests.length === 0) {
    console.error("Weekly mock test job: no tests were generated this run.");
    return { created: 0, notified: 0 };
  }

  let notified = 0;
  if (env.RESEND_API_KEY) {
    try {
      const [students, tutors] = await Promise.all([
        filterEntity(env, "User", { query: { user_type: "student" }, limit: 1000 }),
        filterEntity(env, "User", { query: { user_type: "tutor" }, limit: 1000 }),
      ]);

      const recipients = [...students, ...tutors].map((u) => u.email).filter(Boolean);

      // Resend's free tier caps at 100 emails/day -- fine at ACAD's current
      // scale, but if the recipient list grows past that, this single-batch
      // send will start silently failing for the overflow. Worth revisiting
      // (e.g. splitting into multiple sends, or a paid tier) once enrollment
      // grows meaningfully past that number.
      if (recipients.length > 0) {
        const { subject, html } = buildNotificationEmail({ weekOf, createdTests });
        // BCC keeps recipients' addresses private from each other; "to" is
        // required by Resend's API, so we address it to ACAD itself.
        await sendEmailViaResend(env, {
          to: env.EMAIL_FROM || "notifications@acadapp.in",
          subject,
          html,
          bcc: recipients,
        });
        notified = recipients.length;
      }
    } catch (err) {
      console.error("Weekly mock test notification email failed:", err);
    }
  }

  return { created: createdTests.length, notified };
}
