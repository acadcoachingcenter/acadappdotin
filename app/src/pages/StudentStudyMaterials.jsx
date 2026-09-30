import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import {
  ACAD_GRADES,
  buildSubjectOptions,
  customSubjectName,
  gradeLabel,
  isCustomSubject,
} from "@/lib/studyMaterialCatalog";
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
  // For ACAD subjects outside the SchoolBook registry (e.g. Hindi), students
  // pick a grade and see every chapter tutors have shared, grouped by chapter.
  const [customGrade, setCustomGrade] = useState("");

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

  const { registry: registrySubjects, custom: customSubjects } = buildSubjectOptions(availableChapters);
  const isCustom = isCustomSubject(selectedSubject);
  const chaptersForSubject = isCustom
    ? []
    : availableChapters.filter((c) => c.subjectId === selectedSubject);
  const subjectObj = registrySubjects.find((s) => s.value === selectedSubject);
  const subjectName = isCustom ? customSubjectName(selectedSubject) : subjectObj?.subjectName || "";

  // Registry subjects: materials for one chapter. ACAD subjects: every
  // material for that subject + grade (shown grouped by chapter below).
  const query = isCustom
    ? customGrade
      ? { subject: subjectName, grade: gradeLabel(customGrade), is_active: true }
      : null
    : selectedChapter && subjectObj
      ? { subject: subjectName, chapter: selectedChapter, is_active: true }
      : null;
  const queryKey = query ? JSON.stringify(query) : "";

  useEffect(() => {
    if (!queryKey) {
      setMaterials([]);
      return;
    }

    let cancelled = false;
    setIsLoadingMaterials(true);
    setMaterialsError("");

    apiClient.entities.StudyMaterial.filter(JSON.parse(queryKey), "-created_date", 200)
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
  }, [queryKey]);

  // Group by chapter title for the ACAD-subject view.
  const groups = [];
  if (isCustom) {
    const byChapter = new Map();
    for (const m of materials) {
      const key = m.chapter_title || m.chapter || "Other";
      if (!byChapter.has(key)) byChapter.set(key, []);
      byChapter.get(key).push(m);
    }
    for (const [chapter, items] of byChapter) groups.push({ chapter, items });
    groups.sort((a, b) => a.chapter.localeCompare(b.chapter, undefined, { numeric: true }));
  } else if (materials.length) {
    groups.push({ chapter: null, items: materials });
  }

  const showResults = isCustom ? Boolean(customGrade) : Boolean(selectedChapter);

  const renderMaterial = (m) => (
    <Card key={m.id}>
      <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900">{m.title}</p>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {TYPE_LABELS[m.file_type] || "Material"}
            </span>
          </div>
          {m.description && <p className="text-sm text-slate-600 mt-1">{m.description}</p>}
          {m.tutor_name && <p className="text-xs text-slate-400 mt-1">Shared by {m.tutor_name}</p>}
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
  );

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
              Couldn't load textbook chapters: {chapterLoadError}. Subjects under "All ACAD
              subjects" still work.
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
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {registrySubjects.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Textbook library</SelectLabel>
                      {registrySubjects.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {registrySubjects.length > 0 && <SelectSeparator />}
                  <SelectGroup>
                    <SelectLabel>All ACAD subjects</SelectLabel>
                    {customSubjects.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {isLoadingChapters && <p className="text-xs text-slate-500">Loading textbook chapters…</p>}
            </div>

            {isCustom ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Grade</label>
                <Select value={customGrade} onValueChange={setCustomGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACAD_GRADES.map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {gradeLabel(g)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
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
            )}
          </div>
        </CardContent>
      </Card>

      {showResults && (
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
                {isCustom
                  ? `No ${subjectName} materials shared for ${gradeLabel(customGrade)} yet.`
                  : "No materials shared for this chapter yet."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groups.map((g) => (
                <div key={g.chapter || "all"} className="space-y-3">
                  {g.chapter && <h3 className="text-sm font-semibold text-slate-700">{g.chapter}</h3>}
                  {g.items.map(renderMaterial)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
