import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Link2, Loader2, Trash2, Pencil, Save, X, PlusCircle, ExternalLink } from "lucide-react";

export default function TutorStudyMaterials() {
  // Pages rendered via pages.config.js get no props - the current user
  // comes from AuthContext, same as every other top-level page, not
  // passed down the way StudentClassroomPage.jsx receives it from its
  // parent. Using a `user` prop here (as an earlier version of this file
  // did) left `user` permanently undefined, crashing on the first
  // `user.id` access with "can't access property 'id', e is undefined".
  const { user, isLoadingAuth } = useAuth();
  // Same ingested-chapter registry GradeMe's admin generator uses, so
  // "Grade 9 Physics Chapter 3" means the same thing in both features
  // instead of two separate, potentially-drifting chapter lists.
  const [availableChapters, setAvailableChapters] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [chapterLoadError, setChapterLoadError] = useState("");

  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("ppt");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const loadMaterials = useCallback(async () => {
    if (!user?.id) {
      setMaterials([]);
      setIsLoadingMaterials(false);
      return;
    }

    setIsLoadingMaterials(true);
    try {
      const data = await apiClient.entities.StudyMaterial.filter(
        { tutor_id: user.id },
        "-created_date",
        200
      );
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading study materials:", error);
      setMaterials([]);
    } finally {
      setIsLoadingMaterials(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoadingAuth) return;
    loadMaterials();
  }, [isLoadingAuth, loadMaterials]);

  // Unique subjects present in the registry, in first-seen order.
  const subjects = [];
  const seenSubjects = new Set();
  for (const c of availableChapters) {
    if (!seenSubjects.has(c.subjectId)) {
      seenSubjects.add(c.subjectId);
      subjects.push(c);
    }
  }

  const chaptersForSubject = availableChapters.filter((c) => c.subjectId === selectedSubject);

  const resetForm = () => {
    setSelectedSubject("");
    setSelectedChapter("");
    setTitle("");
    setDescription("");
    setFileUrl("");
    setFileType("ppt");
    setFormError("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!user?.id) {
      setFormError("You need to be signed in to add a material.");
      return;
    }
    if (!selectedSubject || !selectedChapter) {
      setFormError("Pick a subject and chapter first.");
      return;
    }
    if (!title.trim()) {
      setFormError("Please enter a title.");
      return;
    }
    if (!fileUrl.trim()) {
      setFormError("Please paste the Google Drive link.");
      return;
    }

    const subjectObj = subjects.find((s) => s.subjectId === selectedSubject);
    const chapterObj = chaptersForSubject.find((c) => c.chapterId === selectedChapter);

    setIsSaving(true);
    try {
      // is_active defaults to true - visible to students immediately once
      // added, no approval step. Admin can revoke visibility separately.
      await apiClient.entities.StudyMaterial.create({
        tutor_id: user.id,
        tutor_name: user.full_name || user.email,
        title: title.trim(),
        description: description.trim(),
        file_url: fileUrl.trim(),
        file_type: fileType,
        grade: subjectObj?.className || "",
        subject: subjectObj?.subjectName || "",
        chapter: selectedChapter,
        chapter_title: chapterObj?.chapterTitle || selectedChapter,
        is_active: true,
      });
      resetForm();
      await loadMaterials();
    } catch (error) {
      console.error("Error adding study material:", error);
      setFormError(error.message || "Failed to add material.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditForm({
      title: m.title || "",
      description: m.description || "",
      file_url: m.file_url || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (m) => {
    setIsSavingEdit(true);
    try {
      await apiClient.entities.StudyMaterial.update(m.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        file_url: editForm.file_url.trim(),
      });
      cancelEdit();
      await loadMaterials();
    } catch (error) {
      console.error("Error updating study material:", error);
      alert("Failed to update: " + (error.message || "Unknown error"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
    try {
      await apiClient.entities.StudyMaterial.delete(m.id);
      await loadMaterials();
    } catch (error) {
      console.error("Error deleting study material:", error);
      alert("Failed to delete: " + (error.message || "Unknown error"));
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="max-w-lg">
        <CardContent className="py-8 text-center text-slate-600">
          Please sign in to manage your study materials.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Study Materials</h1>
        <p className="text-slate-600 mt-1">
          Share a Google Drive link (slides, notes, worksheets) for any chapter you teach. Visible to
          every student studying that chapter as soon as you add it.
        </p>
      </div>

      <Card className="border-2 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-600" />
            Add Material
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chapterLoadError && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              Couldn't load chapters: {chapterLoadError}
            </p>
          )}

          <form onSubmit={handleAdd} className="space-y-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3 slides - Motion in a Straight Line"
              />
            </div>

            <div className="grid sm:grid-cols-[1fr_140px] gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Google Drive Link</label>
                <Input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://docs.google.com/presentation/d/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Type</label>
                <Select value={fileType} onValueChange={setFileType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ppt">Slides</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="doc">Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Anything students should know before opening this"
              />
            </div>

            <p className="text-xs text-slate-500">
              Make sure the Drive file's sharing setting is "Anyone with the link can view" - otherwise
              students won't be able to open it.
            </p>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Adding…" : "Add Material"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-3">Your Materials</h2>

        {isLoadingMaterials ? (
          <div className="flex items-center gap-2 py-8 justify-center text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              You haven't added any materials yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {materials.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-4">
                  {editingId === m.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Title"
                      />
                      <Input
                        type="url"
                        value={editForm.file_url}
                        onChange={(e) => setEditForm({ ...editForm, file_url: e.target.value })}
                        placeholder="Drive link"
                      />
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        rows={2}
                        placeholder="Notes"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(m)}
                          disabled={isSavingEdit}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          {isSavingEdit ? "Saving…" : "Save"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{m.title}</p>
                          {!m.is_active && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                              Hidden by admin
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">
                          {m.grade} · {m.subject} · {m.chapter_title}
                        </p>
                        {m.description && (
                          <p className="text-sm text-slate-500 mt-1">{m.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={m.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open
                        </a>
                        <button
                          onClick={() => startEdit(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
