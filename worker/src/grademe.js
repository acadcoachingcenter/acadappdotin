import { invokeLLM } from "./llm.js";
import { createEntity } from "./entities.js";

// Server-to-server call to SchoolBook's admin-key-gated endpoint. Never
// exposed to the browser -- SCHOOLBOOK_ADMIN_KEY must be the same value as
// SchoolBook's own ADMIN_INGEST_KEY secret (set via `wrangler secret put`
// on this Worker, not committed anywhere).
async function fetchChapterContext(env, subject, chapter) {
  if (!env.SCHOOLBOOK_API_URL || !env.SCHOOLBOOK_ADMIN_KEY) {
    throw new Error("SchoolBook integration is not configured (SCHOOLBOOK_API_URL / SCHOOLBOOK_ADMIN_KEY).");
  }

  const url = `${env.SCHOOLBOOK_API_URL}/api/admin/chapter-context?subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`;

  const res = await fetch(url, {
    headers: { "X-Admin-Key": env.SCHOOLBOOK_ADMIN_KEY },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SchoolBook chapter-context request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  return res.json();
}

function buildMcqSchema(count) {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: count,
        maxItems: count,
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4,
            },
            correct_index: { type: "integer", minimum: 0, maximum: 3 },
            explanation: { type: "string" },
          },
          required: ["question", "options", "correct_index", "explanation"],
        },
      },
    },
    required: ["questions"],
  };
}

function buildMcqPrompt({ chapterTitle, context, count, difficulty }) {
  return (
    `You are writing ${count} multiple-choice practice questions for an Indian NEET/JEE/CBSE student, ` +
    `strictly based on the NCERT chapter content below. Chapter: "${chapterTitle}". ` +
    `Target difficulty: ${difficulty || "mixed"}.\n\n` +
    `Rules:\n` +
    `- Base every question ONLY on facts present in the provided content -- do not invent facts outside it.\n` +
    `- Each question needs exactly 4 options, only one correct.\n` +
    `- correct_index is 0-based (0, 1, 2, or 3).\n` +
    `- explanation should briefly justify the correct answer using the chapter content.\n` +
    `- Vary question style: definitions, numerical/conceptual application, cause-effect, comparisons.\n\n` +
    `CHAPTER CONTENT:\n${context}`
  );
}

/**
 * Generates `count` AI-drafted MCQs for a subject/chapter, grounded in
 * SchoolBook's ingested NCERT text, and writes them to grademe_questions
 * with status "pending" -- nothing here is shown to students until an
 * admin approves it via the GradeMe approval queue.
 */
export async function generateGradeMeQuestions(env, { subject, chapter, chapterTitle, count = 10, difficulty = "mixed" }, adminUserId) {
  if (!subject || !chapter) {
    throw new Error("subject and chapter are required.");
  }

  const n = Math.min(Math.max(parseInt(count, 10) || 10, 1), 25);

  const { context, chunkCount, note } = await fetchChapterContext(env, subject, chapter);

  if (!context) {
    throw new Error(note || "No ingested NCERT content found for this chapter yet.");
  }

  const schema = buildMcqSchema(n);
  const prompt = buildMcqPrompt({ chapterTitle: chapterTitle || chapter, context, count: n, difficulty });

  const result = await invokeLLM(env, { prompt, response_json_schema: schema });
  const drafted = Array.isArray(result?.questions) ? result.questions : [];

  if (drafted.length === 0) {
    throw new Error("The AI did not return any questions -- try again or reduce the requested count.");
  }

  const created = [];
  for (const q of drafted) {
    if (!q?.question || !Array.isArray(q.options) || q.options.length !== 4) continue;

    const row = await createEntity(
      env,
      "GradeMeQuestion",
      {
        subject,
        chapter,
        chapter_title: chapterTitle || chapter,
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation || "",
        difficulty,
        status: "pending",
        source: "ai",
      },
      adminUserId
    );
    created.push(row);
  }

  return { created, chunkCount, requested: n, drafted: drafted.length };
}

/** Proxies SchoolBook's public (unauthenticated) subject list, server-to-server,
 * so the browser only ever talks to acad-api and never hits SchoolBook's CORS
 * rules directly. */
export async function fetchSchoolBookSubjects(env) {
  if (!env.SCHOOLBOOK_API_URL) throw new Error("SCHOOLBOOK_API_URL is not configured.");
  const res = await fetch(`${env.SCHOOLBOOK_API_URL}/api/subjects`);
  if (!res.ok) throw new Error(`SchoolBook /api/subjects failed (${res.status}).`);
  return res.json();
}

/** Same proxy pattern for a given subject's chapter list. */
export async function fetchSchoolBookChapters(env, subjectId) {
  if (!env.SCHOOLBOOK_API_URL) throw new Error("SCHOOLBOOK_API_URL is not configured.");
  const res = await fetch(`${env.SCHOOLBOOK_API_URL}/api/chapters?subject=${encodeURIComponent(subjectId)}`);
  if (!res.ok) throw new Error(`SchoolBook /api/chapters failed (${res.status}).`);
  return res.json();
}
