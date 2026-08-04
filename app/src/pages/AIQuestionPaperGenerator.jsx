import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import PaperContent from "@/components/qpaper/PaperContent";
import {
  Sparkles,
  Printer,
  Save,
  FileText,
  Loader2,
  Eye,
  Trash2,
  Copy
} from "lucide-react";

const DEFAULT_DISTRIBUTION =
  "Section A: 10 MCQs × 1 mark\nSection B: 5 short answer × 3 marks\nSection C: 2 long answer × 10 marks";

export default function AIQuestionPaperGenerator() {
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    subject: "",
    grade_level: "",
    difficulty: "Moderate",
    total_marks: 50,
    duration_minutes: 90,
    topics: "",
    question_distribution: DEFAULT_DISTRIBUTION
  });

  const [generating, setGenerating] = useState(false);
  const [paper, setPaper] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const items =
        await apiClient.entities.QuestionPaper.list(
          "-created_date",
          20
        );

      setHistory(items);
    } catch (e) {
      console.error("Failed to load question papers:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const update = (key, value) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleGenerate = async () => {
    if (!form.title || !form.subject || !form.grade_level) {
      toast({
        title: "Please fill title, subject and grade level",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    setPaper(null);
    setSavedId(null);

    try {
      const prompt = `You are an expert examination paper setter for an Indian school/coaching institute. Generate a complete, original question paper matching the specification below.

Subject: ${form.subject}
Grade/Class: ${form.grade_level}
Difficulty: ${form.difficulty}
Total Marks: ${form.total_marks}
Duration: ${form.duration_minutes} minutes
Topics to cover: ${form.topics || "General syllabus"}
Section / question distribution:
${form.question_distribution}

Rules:
- Every question must be original, syllabus-appropriate and unambiguous.
- For MCQ / true_false questions include a 'options' array (4 options for MCQ) and the correct 'answer'.
- For short / long / fill questions include an 'answer_hint' (concise model answer outline).
- Add 3-5 general exam instructions appropriate for the grade.
- The sum of (marks_per_question × number_of_questions) across all sections must equal ${form.total_marks}.
- If the subject is a Hindi / Sanskrit / regional language subject, write questions in that language; otherwise use English.
- Return ONLY a JSON object matching the schema.`;

      const result =
        await apiClient.integrations.Core.InvokeLLM({
          prompt,

          response_json_schema: {
            type: "object",

            properties: {
              paper_title: {
                type: "string"
              },

              instructions: {
                type: "array",
                items: {
                  type: "string"
                }
              },

              sections: {
                type: "array",

                items: {
                  type: "object",

                  properties: {
                    name: {
                      type: "string"
                    },

                    type: {
                      type: "string",
                      enum: [
                        "mcq",
                        "short",
                        "long",
                        "fill",
                        "true_false"
                      ]
                    },

                    marks_per_question: {
                      type: "number"
                    },

                    questions: {
                      type: "array",

                      items: {
                        type: "object",

                        properties: {
                          text: {
                            type: "string"
                          },

                          options: {
                            type: "array",
                            items: {
                              type: "string"
                            }
                          },

                          answer: {
                            type: "string"
                          },

                          answer_hint: {
                            type: "string"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });

      setPaper(result);

      toast({
        title: "Question paper generated!"
      });

    } catch (e) {
      console.error("Question paper generation failed:", e);

      toast({
        title: "Generation failed: " + e.message,
        variant: "destructive"
      });

    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!paper) return;

    setSaving(true);

    try {
      const payload = {
        title: form.title,
        subject: form.subject,
        grade_level: form.grade_level,
        difficulty: form.difficulty,

        total_marks:
          Number(form.total_marks),

        duration_minutes:
          Number(form.duration_minutes),

        topics: (form.topics || "")
          .split(/[,\n]/)
          .map(s => s.trim())
          .filter(Boolean),

        question_distribution:
          form.question_distribution,

        paper_content:
          paper,

        instructions:
          paper.instructions || [],

        status:
          "generated"
      };

      const rec =
        await apiClient.entities.QuestionPaper.create(
          payload
        );

      setSavedId(rec.id);

      setHistory(prev => [
        rec,
        ...prev
      ]);

      toast({
        title: "Paper saved to library"
      });

    } catch (e) {
      console.error("Save failed:", e);

      toast({
        title: "Save failed: " + e.message,
        variant: "destructive"
      });

    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!paper) return;

    const lines = [];

    lines.push(
      paper.paper_title || form.title
    );

    lines.push(
      `Subject: ${form.subject}  |  Class: ${form.grade_level}`
    );

    lines.push(
      `Max Marks: ${form.total_marks}  |  Duration: ${form.duration_minutes} min`
    );

    lines.push("");

    (paper.instructions || []).forEach(
      instruction => {
        lines.push("• " + instruction);
      }
    );

    lines.push("");

    (paper.sections || []).forEach(sec => {
      lines.push(
        `${sec.name}  (${sec.marks_per_question} marks each)`
      );

      (sec.questions || []).forEach(
        (question, index) => {

          lines.push(
            `Q${index + 1}. ${question.text}`
          );

          if (question.options?.length) {
            question.options.forEach(
              (option, optionIndex) => {

                lines.push(
                  `   ${String.fromCharCode(
                    65 + optionIndex
                  )}) ${option}`
                );

              }
            );
          }

          if (question.answer) {
            lines.push(
              `   Ans: ${question.answer}`
            );
          }

          if (question.answer_hint) {
            lines.push(
              `   Hint: ${question.answer_hint}`
            );
          }
        }
      );

      lines.push("");
    });

    navigator.clipboard.writeText(
      lines.join("\n")
    );

    toast({
      title: "Copied as text"
    });
  };

  const loadSavedPaper = rec => {
    setPaper(rec.paper_content);

    setForm({
      title:
        rec.title || "",

      subject:
        rec.subject || "",

      grade_level:
        rec.grade_level || "",

      difficulty:
        rec.difficulty || "Moderate",

      total_marks:
        rec.total_marks ?? 0,

      duration_minutes:
        rec.duration_minutes ?? 0,

      topics:
        Array.isArray(rec.topics)
          ? rec.topics.join(", ")
          : rec.topics || "",

      question_distribution:
        rec.question_distribution || ""
    });

    setSavedId(rec.id);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const deletePaper = async id => {
    if (!window.confirm("Delete this paper?")) {
      return;
    }

    try {
      await apiClient.entities.QuestionPaper.delete(
        id
      );

      setHistory(prev =>
        prev.filter(item => item.id !== id)
      );

      if (savedId === id) {
        setSavedId(null);
      }

      toast({
        title: "Deleted"
      });

    } catch (e) {
      console.error("Delete failed:", e);

      toast({
        title: "Delete failed: " + e.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <div className="print:hidden flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            AI Question Paper Generator
          </h1>

          <p className="text-slate-600">
            Generate complete, syllabus-aligned exam papers
            with answer keys in seconds.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>
              Paper Configuration
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            <div>
              <Label htmlFor="title">
                Paper Title *
              </Label>

              <Input
                id="title"
                value={form.title}
                onChange={e =>
                  update(
                    "title",
                    e.target.value
                  )
                }
                placeholder="e.g. Mid-Term Mathematics Exam"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <Label htmlFor="subject">
                  Subject *
                </Label>

                <Input
                  id="subject"
                  value={form.subject}
                  onChange={e =>
                    update(
                      "subject",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Mathematics"
                />
              </div>

              <div>
                <Label htmlFor="grade">
                  Class / Grade *
                </Label>

                <Input
                  id="grade"
                  value={form.grade_level}
                  onChange={e =>
                    update(
                      "grade_level",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Class 10"
                />
              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <Label>
                  Difficulty
                </Label>

                <Select
                  value={form.difficulty}
                  onValueChange={value =>
                    update(
                      "difficulty",
                      value
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Easy">
                      Easy
                    </SelectItem>

                    <SelectItem value="Moderate">
                      Moderate
                    </SelectItem>

                    <SelectItem value="Exam">
                      Exam-level
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="marks">
                  Total Marks
                </Label>

                <Input
                  id="marks"
                  type="number"
                  value={form.total_marks}
                  onChange={e =>
                    update(
                      "total_marks",
                      e.target.value
                    )
                  }
                />
              </div>

            </div>

            <div>
              <Label htmlFor="duration">
                Duration (minutes)
              </Label>

              <Input
                id="duration"
                type="number"
                value={form.duration_minutes}
                onChange={e =>
                  update(
                    "duration_minutes",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <Label htmlFor="topics">
                Topics (comma-separated)
              </Label>

              <Textarea
                id="topics"
                value={form.topics}
                onChange={e =>
                  update(
                    "topics",
                    e.target.value
                  )
                }
                placeholder="e.g. Algebra, Geometry, Trigonometry"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="dist">
                Section / Question Distribution
              </Label>

              <Textarea
                id="dist"
                value={form.question_distribution}
                onChange={e =>
                  update(
                    "question_distribution",
                    e.target.value
                  )
                }
                rows={4}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Paper
                </>
              )}
            </Button>

          </CardContent>
        </Card>

        <Card className={paper ? "" : "print:hidden"}>
          <CardContent className="p-6">

            {paper ? (
              <>

                <div className="flex justify-end gap-2 mb-4 print:hidden">

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print / PDF
                  </Button>

                  {!savedId && (
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {saving
                        ? "Saving…"
                        : "Save"}
                    </Button>
                  )}

                  {savedId && (
                    <Badge variant="secondary">
                      Saved ✓
                    </Badge>
                  )}

                </div>

                <PaperContent
                  paper={paper}
                  meta={form}
                />

              </>
            ) : (

              <div className="p-12 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />

                <p>
                  Your generated question paper will
                  appear here.
                </p>
              </div>

            )}

          </CardContent>
        </Card>

      </div>

      <Card className="print:hidden">

        <CardHeader>
          <CardTitle>
            Saved Papers
          </CardTitle>
        </CardHeader>

        <CardContent>

          {loadingHistory ? (

            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>

          ) : history.length === 0 ? (

            <p className="text-slate-500 text-sm text-center py-6">
              No papers saved yet. Generate one and
              click Save.
            </p>

          ) : (

            <div className="grid md:grid-cols-3 gap-3">

              {history.map(rec => (

                <div
                  key={rec.id}
                  className="border rounded-lg p-3 hover:shadow-sm"
                >

                  <div className="flex items-start justify-between gap-2">

                    <div className="min-w-0">

                      <p className="font-semibold truncate">
                        {rec.title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {rec.subject} •{" "}
                        {rec.grade_level}
                      </p>

                    </div>

                    <Badge variant="outline">
                      {rec.difficulty}
                    </Badge>

                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    {rec.total_marks} marks •{" "}
                    {rec.duration_minutes} min
                  </p>

                  <div className="flex gap-2 mt-3">

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        loadSavedPaper(rec)
                      }
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        deletePaper(rec.id)
                      }
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </CardContent>
      </Card>

    </div>
  );
}
