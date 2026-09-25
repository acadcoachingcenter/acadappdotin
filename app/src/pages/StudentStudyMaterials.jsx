import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BookOpen, ExternalLink, Loader2, FileQuestion } from "lucide-react";

const TYPE_LABELS = {
  ppt: "Slides",
  pdf: "PDF",
  doc: "Document",
  video: "Video",
  other: "Material",
};

// Read-only browsing view - same chapter registry and storage shape as
// TutorStudyMaterials.jsx, so a chapter picked here matches exactly what a
// tutor picked when adding a material for it. Shows every tutor's active
// material for the chosen chapter (shared library, not scoped to one
// tutor) - materials an admin has hidden (is_active: false) never appear
// here regardless of who added them.
export default function StudentStudyMaterials() {
  const [availableChapters, setAvailableChapters] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [chapterLoadError, setChapterLoadError] = useState("");

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");

  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  useEffect(() => {
    setIsLoadingChapters(true);
    apiClient.grademe
      .availableChapters()
      .then((data) => {
        setAvailableChapters(Array.isArray(data) ? data : []);
        setChapterLoadError("");
      })
      .catch((error) => {
        console.error("Error loading available chapters:", error);
        setAvailableChapters([]);
        setChapterLoadError(error.message || "Failed to load chapters.");
      })
      .finally(() => setIsLoadingChapters(false));
  }, []);

  const subjects = [];
  const seenSubjects = new Set();
  for (const c of availableChapters) {
    if (!seenSubjects.has(c.subjectId)) {
      seenSubjects.add(c.subjectId);
      subjects.push(c);
    }
  }

  const chaptersForSubject = availableChapters.filter((c) => c.subjectId === selectedSubject);
  const subjectObj = subjects.find((s) => s.subjectId === selectedSubject);

  useEffect(() => {
    if (!selectedSubject || !selectedChapter || !subjectObj) {
      setMaterials([]);
      return;
    }

    let cancelled = false;
    setIsLoadingMaterials(true);
    setMaterialsError("");

    apiClient.entities.StudyMaterial.filter(
      {
        subject: subjectObj.subjectName,
        chapter: selectedChapter,
        is_active: true,
      },
      "-created_date",
      100
    )
      .then((data) => {
        if (cancelled) return;
        setMaterials(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error loading study materials:", error);
        if (cancelled) return;
        setMaterials([]);
        setMaterialsError(error.message || "Failed to load materials for this chapter.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMaterials(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSubject, selectedChapter, subjectObj]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Study Materials</h1>
        <p className="text-slate-600 mt-1">
          Slides, notes, and other material shared by tutors for a specific chapter.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Pick a chapter
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chapterLoadError && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Couldn't load chapters: {chapterLoadError}
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Subject</label>
              <Select
                value={selectedSubject}
                onValueChange={(v) => {
                  setSelectedSubject(v);
                  setSelectedChapter("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingChapters ? "Loading…" : "Select a subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.subjectId} value={s.subjectId}>
                      {s.className ? `${s.className} — ${s.subjectName}` : s.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Chapter</label>
              <Select
                value={selectedChapter}
                onValueChange={setSelectedChapter}
                disabled={!selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedSubject ? "Select a chapter" : "Pick a subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {chaptersForSubject.map((c) => (
                    <SelectItem key={c.chapterId} value={c.chapterId}>
                      {c.chapterTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedChapter && (
        <div>
          {isLoadingMaterials ? (
            <div className="flex items-center gap-2 py-8 justify-center text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : materialsError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {materialsError}
            </p>
          ) : materials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                <FileQuestion className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                No materials shared for this chapter yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {materials.map((m) => (
                <Card key={m.id}>
                  <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900">{m.title}</p>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          {TYPE_LABELS[m.file_type] || "Material"}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-sm text-slate-600 mt-1">{m.description}</p>
                      )}
                      {m.tutor_name && (
                        <p className="text-xs text-slate-400 mt-1">Shared by {m.tutor_name}</p>
                      )}
                    </div>
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
