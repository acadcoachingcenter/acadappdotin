import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  FileQuestion,
} from "lucide-react";

const DIFFICULTIES = ["easy", "medium", "hard", "mixed"];

export default function AdminGradeMe() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("mixed");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generateResult, setGenerateResult] = useState(null);

  const [pending, setPending] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [edits, setEdits] = useState({}); // { [questionId]: { question, options[4], correct_index, explanation } }
  const [savingId, setSavingId] = useState(null);

  // ---------- Subject / chapter pickers, sourced from SchoolBook ----------

  useEffect(() => {
    apiClient.grademe
      .subjects()
      .then((data) => setSubjects(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Error loading subjects:", error);
        setSubjects([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      setSelectedChapter("");
      return;
    }
    apiClient.grademe
      .chapters(selectedSubject)
      .then((data) => setChapters(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Error loading chapters:", error);
        setChapters([]);
      });
  }, [selectedSubject]);

  // ---------- Pending queue ----------

  const loadPending = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const data = await apiClient.entities.GradeMeQuestion.filter(
        { status: "pending" },
        "-created_date",
        200
      );
      const rows = Array.isArray(data) ? data : [];
      setPending(rows);

      // Seed the edit state for any row we don't already have local edits for,
      // so typing in one card never resets another that's mid-edit.
      setEdits((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          if (!next[row.id]) {
            next[row.id] = {
              question: row.question || "",
              options: Array.isArray(row.options) && row.options.length === 4
                ? row.options
                : ["", "", "", ""],
              correct_index: row.correct_index ?? 0,
              explanation: row.explanation || "",
            };
          }
        }
        return next;
      });
    } catch (error) {
      console.error("Error loading GradeMe queue:", error);
      setPending([]);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // ---------- Generate ----------

  const handleGenerate = async () => {
    if (!selectedSubject || !selectedChapter) {
      setGenerateError("Pick a subject and chapter first.");
      return;
    }

    setIsGenerating(true);
    setGenerateError("");
    setGenerateResult(null);

    const chapterObj = chapters.find((c) => c.id === selectedChapter);
    const subjectObj = subjects.find((s) => s.id === selectedSubject);

    try {
      const result = await apiClient.grademe.generate({
        subject: selectedSubject,
        chapter: selectedChapter,
        chapterTitle: chapterObj
          ? `${subjectObj?.name || ""} — ${chapterObj.name}`.trim()
          : selectedChapter,
        count,
        difficulty,
      });
      setGenerateResult(result);
      await loadPending();
    } catch (error) {
      console.error("Error generating GradeMe questions:", error);
      setGenerateError(
        error.message ||
          "Generation failed. Make sure this chapter has been ingested into SchoolBook first."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------- Edit / approve / reject ----------

  const updateEdit = (id, patch) => {
    setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const updateOption = (id, index, value) => {
    setEdits((prev) => {
      const current = prev[id];
      const options = [...current.options];
      options[index] = value;
      return { ...prev, [id]: { ...current, options } };
    });
  };

  const decide = async (row, status) => {
    setSavingId(row.id);
    const edited = edits[row.id];
    try {
      await apiClient.entities.GradeMeQuestion.update(row.id, {
        question: edited.question,
        options: edited.options,
        correct_index: Number(edited.correct_index),
        explanation: edited.explanation,
        status,
      });
      setPending((prev) => prev.filter((r) => r.id !== row.id));
    } catch (error) {
      console.error(`Error setting question to ${status}:`, error);
      alert(`Failed to ${status === "approved" ? "approve" : "reject"}: ${error.message || "Unknown error"}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">GradeMe</h1>
        <p className="text-slate-600 mt-1">
          Generate AI-drafted practice questions from SchoolBook's ingested NCERT chapters,
          then review and approve before students see them.
        </p>
      </div>

      {/* ---------- Generate panel ---------- */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#1565C0]" />
            Generate New Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.className ? `${s.className} — ${s.name}` : s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select
                value={selectedChapter}
                onValueChange={setSelectedChapter}
                disabled={!selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedSubject ? "Select a chapter" : "Pick a subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of questions</Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} questions
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d[0].toUpperCase() + d.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {generateError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {generateError}
            </p>
          )}

          {generateResult && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Drafted {generateResult.created?.length ?? 0} of {generateResult.requested} requested
              questions from {generateResult.chunkCount} chapter chunks. Review them below.
            </p>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedSubject || !selectedChapter}
            className="bg-[#1565C0] hover:bg-[#1e88e5]"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "Generating…" : "Generate Questions"}
          </Button>
        </CardContent>
      </Card>

      {/* ---------- Review queue ---------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-[#1565C0]" />
            Pending Review
          </h2>
          <Badge variant="outline">{pending.length} waiting</Badge>
        </div>

        {isLoadingQueue ? (
          <div className="flex items-center gap-2 py-12 justify-center text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading queue…
          </div>
        ) : pending.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              Nothing waiting for review. Generate a new batch above.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.map((row) => {
              const edited = edits[row.id];
              if (!edited) return null;
              const isSaving = savingId === row.id;

              return (
                <Card key={row.id}>
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-slate-900 text-white">{row.chapter_title || row.chapter}</Badge>
                      <Badge variant="outline">{row.difficulty || "mixed"}</Badge>
                      <Badge variant="outline">{row.source === "ai" ? "AI-drafted" : "Manual"}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Textarea
                        value={edited.question}
                        onChange={(e) => updateEdit(row.id, { question: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Options (select the correct one)</Label>
                      <RadioGroup
                        value={String(edited.correct_index)}
                        onValueChange={(v) => updateEdit(row.id, { correct_index: Number(v) })}
                      >
                        {edited.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <RadioGroupItem value={String(i)} id={`${row.id}-opt${i}`} />
                            <input
                              className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm"
                              value={opt}
                              onChange={(e) => updateOption(row.id, i, e.target.value)}
                            />
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Explanation</Label>
                      <Textarea
                        value={edited.explanation}
                        onChange={(e) => updateEdit(row.id, { explanation: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3 pt-1">
                      <Button
                        onClick={() => decide(row, "approved")}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Approve
                      </Button>
                      <Button
                        onClick={() => decide(row, "rejected")}
                        disabled={isSaving}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
