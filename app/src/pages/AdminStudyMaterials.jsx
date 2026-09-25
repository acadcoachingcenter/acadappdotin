import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink, EyeOff, Eye, Trash2, Search } from "lucide-react";

const TYPE_LABELS = {
  ppt: "Slides",
  pdf: "PDF",
  doc: "Document",
  video: "Video",
  other: "Material",
};

export default function AdminStudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.entities.StudyMaterial.list("-created_date", 1000);
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading study materials:", error);
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleToggleActive = async (m) => {
    setBusyId(m.id);
    try {
      await apiClient.entities.StudyMaterial.update(m.id, { is_active: !m.is_active });
      await loadMaterials();
    } catch (error) {
      console.error("Error toggling study material visibility:", error);
      alert("Failed to update: " + (error.message || "Unknown error"));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Permanently delete "${m.title}"? This cannot be undone.`)) return;
    setBusyId(m.id);
    try {
      await apiClient.entities.StudyMaterial.delete(m.id);
      await loadMaterials();
    } catch (error) {
      console.error("Error deleting study material:", error);
      alert("Failed to delete: " + (error.message || "Unknown error"));
    } finally {
      setBusyId(null);
    }
  };

  const term = search.trim().toLowerCase();
  const filtered = term
    ? materials.filter((m) =>
        [m.title, m.tutor_name, m.grade, m.subject, m.chapter_title]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term))
      )
    : materials;

  const activeCount = materials.filter((m) => m.is_active).length;
  const hiddenCount = materials.length - activeCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Study Materials</h1>
        <p className="text-slate-600 mt-1">
          Every Google Drive link tutors have shared, across all grades/subjects/chapters. Hide anything
          that shouldn't be visible to students, or delete it outright.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{materials.length}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
              <div className="text-sm text-slate-600">Visible</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-500">{hiddenCount}</div>
              <div className="text-sm text-slate-600">Hidden</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Materials</CardTitle>
          <div className="relative mt-2 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, tutor, chapter…"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-12 justify-center text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              {materials.length === 0 ? "No study materials yet." : "No materials match your search."}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((m) => {
                const isBusy = busyId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`rounded-lg border p-4 ${
                      m.is_active ? "border-slate-200" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">{m.title}</p>
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {TYPE_LABELS[m.file_type] || "Material"}
                          </span>
                          {!m.is_active && (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                              Hidden
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {m.grade} · {m.subject} · {m.chapter_title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {m.tutor_name ? `Added by ${m.tutor_name}` : "Tutor unknown"}
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
                          onClick={() => handleToggleActive(m)}
                          disabled={isBusy}
                          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                            m.is_active
                              ? "border-slate-300 text-slate-600 hover:bg-slate-50"
                              : "border-green-300 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {m.is_active ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Show
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
