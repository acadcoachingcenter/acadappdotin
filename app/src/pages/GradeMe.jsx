import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, FileQuestion, Loader2, Sparkles, XCircle } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const SESSION_SIZE = 10; // questions per attempt -- keeps a session short enough to actually finish

// Fisher-Yates -- so repeat visits to the same chapter don't always show the
// same first 10 questions once the bank grows past SESSION_SIZE.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TopicList({ topics, loading, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        Loading topics…
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        No practice questions are ready yet — check back soon, or ask your tutor to have a chapter
        prepared for GradeMe.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {topics.map((t) => (
        <button
          key={`${t.subject}-${t.chapter}`}
          onClick={() => onSelect(t)}
          className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-[#1565C0]"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1565C0] px-2.5 py-1 text-xs font-semibold text-white">
            {t.subject}
          </span>
          <h3 className="mt-3 text-base font-semibold text-slate-900">{t.chapter_title}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <FileQuestion size={13} />
            {t.question_count} question{t.question_count === 1 ? "" : "s"} ready
          </div>
        </button>
      ))}
    </div>
  );
}

function QuizRunner({ topic, questions, user, onBack }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  function selectAnswer(qIndex, optionIndex) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
  }

  const score = questions.reduce(
    (total, q, i) => (answers[i] === q.correct_index ? total + 1 : total),
    0
  );

  async function handleSubmit() {
    setSubmitted(true);

    // Only students get a progress record -- tutors/admins previewing
    // GradeMe shouldn't show up in student performance reports.
    if (user?.user_type?.toLowerCase() !== "student") return;

    setSaving(true);
    try {
      await apiClient.entities.StudentProgress.create({
        student_id: user.id,
        subject: topic.subject,
        test_name: `GradeMe: ${topic.chapter_title}`,
        score_obtained: String(score),
        max_score: String(questions.length),
        percentage: String(Math.round((score / questions.length) * 100)),
        progress_type: "grademe",
        recorded_date: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error("Unable to save GradeMe result:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        <ChevronLeft size={16} />
        Back to topics
      </button>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">{topic.chapter_title}</h2>
        <p className="mt-1 text-sm text-slate-600">{questions.length} questions</p>
      </div>

      {submitted && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-lg font-semibold text-slate-900">
            Score: {score} / {questions.length} ({Math.round((score / questions.length) * 100)}%)
          </p>
          {saving && <p className="mt-1 text-xs text-slate-500">Saving your result…</p>}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, i) => {
          const selected = answers[i];
          const isCorrect = submitted && selected === q.correct_index;
          const isWrong = submitted && selected !== undefined && selected !== q.correct_index;

          return (
            <div key={q.id || i} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-1 flex items-center gap-2">
                {submitted && isCorrect && <CheckCircle2 size={15} className="text-green-600" />}
                {submitted && isWrong && <XCircle size={15} className="text-red-500" />}
              </div>
              <p className="mb-3 font-medium text-slate-900">
                {i + 1}. {q.question}
              </p>

              <RadioGroup
                value={selected !== undefined ? String(selected) : undefined}
                onValueChange={(val) => selectAnswer(i, Number(val))}
              >
                {q.options.map((opt, optIdx) => {
                  const isThisCorrect = submitted && optIdx === q.correct_index;
                  return (
                    <div
                      key={optIdx}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                        isThisCorrect
                          ? "border-green-300 bg-green-50"
                          : submitted && selected === optIdx
                          ? "border-red-300 bg-red-50"
                          : "border-slate-200"
                      }`}
                    >
                      <RadioGroupItem value={String(optIdx)} id={`q${i}-opt${optIdx}`} disabled={submitted} />
                      <Label htmlFor={`q${i}-opt${optIdx}`} className="cursor-pointer text-sm font-normal">
                        {opt}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>

              {submitted && q.explanation && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full rounded-lg bg-[#1565C0] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1e88e5] sm:w-auto"
        >
          Submit
        </button>
      )}
    </div>
  );
}

export default function GradeMe() {
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(true);

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [sessionQuestions, setSessionQuestions] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const results = await apiClient.grademe.topics();
        setTopics(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error("Unable to load GradeMe topics:", err);
      } finally {
        setLoadingTopics(false);
      }
    }
    load();
  }, []);

  async function startTopic(topic) {
    setSelectedTopic(topic);
    setSessionQuestions(null);
    setSessionError("");
    setLoadingSession(true);
    try {
      const all = await apiClient.entities.GradeMeQuestion.filter({
        status: "approved",
        subject: topic.subject,
        chapter: topic.chapter,
      });
      setSessionQuestions(shuffle(all).slice(0, SESSION_SIZE));
    } catch (err) {
      console.error("Unable to load GradeMe questions:", err);
      setSessionError("Couldn't load questions for this topic. Please go back and try again.");
    } finally {
      setLoadingSession(false);
    }
  }

  function backToTopics() {
    setSelectedTopic(null);
    setSessionQuestions(null);
    setSessionError("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <Sparkles className="h-6 w-6 text-[#1565C0]" />
          GradeMe
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Quick self-graded practice, any time — pick a chapter and get instant scoring with
          explanations.
        </p>
      </div>

      {!selectedTopic && <TopicList topics={topics} loading={loadingTopics} onSelect={startTopic} />}

      {selectedTopic && loadingSession && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Preparing your questions…
        </div>
      )}

      {selectedTopic && sessionError && (
        <div className="space-y-4">
          <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {sessionError}
          </p>
          <button
            onClick={backToTopics}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft size={16} />
            Back to topics
          </button>
        </div>
      )}

      {selectedTopic && sessionQuestions && sessionQuestions.length > 0 && (
        <QuizRunner topic={selectedTopic} questions={sessionQuestions} user={user} onBack={backToTopics} />
      )}
    </div>
  );
}
