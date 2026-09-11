import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, Clock, FileQuestion, Loader2, XCircle } from "lucide-react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

function parseQuestions(mockTest) {
  try {
    return JSON.parse(mockTest.questions || "[]");
  } catch {
    return [];
  }
}

function TestList({ tests, loading, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 size={18} className="animate-spin" />
        Loading mock tests…
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        No mock tests published yet. A fresh NEET and JEE set generates automatically every
        Wednesday — check back soon.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tests.map((t) => {
        const questions = parseQuestions(t);
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className="rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-slate-400"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
              {t.exam_type || "Practice"}
            </span>
            <h3 className="mt-3 text-base font-semibold text-slate-900">{t.title}</h3>
            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <FileQuestion size={13} />
                {questions.length} questions
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {t.duration_minutes} min
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TestRunner({ mockTest, user, onBack }) {
  const questions = parseQuestions(mockTest);
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

    // Only students get a progress record -- tutors/admins previewing the
    // test shouldn't show up in student performance reports.
    if (user?.user_type?.toLowerCase() !== "student") return;

    setSaving(true);
    try {
      await apiClient.entities.StudentProgress.create({
        student_id: user.id,
        subject: mockTest.exam_type || "Mixed",
        test_name: mockTest.title,
        score_obtained: String(score),
        max_score: String(questions.length),
        percentage: String(Math.round((score / questions.length) * 100)),
        progress_type: "mock_test",
        recorded_date: new Date().toISOString().slice(0, 10),
      });
    } catch (err) {
      console.error("Unable to save mock test result:", err);
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
        Back to mock tests
      </button>

      <div>
        <h2 className="text-xl font-semibold text-slate-900">{mockTest.title}</h2>
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
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {q.subject}
                </span>
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
          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white sm:w-auto"
        >
          Submit Test
        </button>
      )}
    </div>
  );
}

export default function WeeklyMockTest() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const results = await apiClient.entities.MockTest.filter({ status: "published" });
        setTests(results);
      } catch (err) {
        console.error("Unable to load mock tests:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Weekly Mock Test</h1>
        <p className="mt-1 text-sm text-slate-600">
          A fresh NEET and JEE practice set, generated automatically every Wednesday.
        </p>
      </div>

      {selectedTest ? (
        <TestRunner mockTest={selectedTest} user={user} onBack={() => setSelectedTest(null)} />
      ) : (
        <TestList tests={tests} loading={loading} onSelect={setSelectedTest} />
      )}
    </div>
  );
}
