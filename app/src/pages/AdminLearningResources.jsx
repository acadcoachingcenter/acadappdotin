import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Save, Trash2, PlusCircle, Loader2, ExternalLink, EyeOff, Eye } from "lucide-react";

const emptyForm = {
  title: "",
  url: "",
  display_order: 0,
  is_active: true,
};

export default function AdminLearningResources() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = not editing, "new" = creating
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.entities.LearningResource.list("display_order");
      setResources(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading learning resources:", error);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const startCreate = () => {
    setFormData({ ...emptyForm, display_order: resources.length });
    setEditingId("new");
  };

  const startEdit = (resource) => {
    setFormData({
      title: resource.title || "",
      url: resource.url || "",
      display_order: resource.display_order ?? 0,
      is_active: resource.is_active !== false,
    });
    setEditingId(resource.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title - this is the button text tutors/students will see, so make it clear (e.g. "Explore Periodic Table" rather than a generic name).');
      return;
    }
    if (!formData.url.trim() || !formData.url.startsWith("http")) {
      alert("Please paste a valid link starting with http:// or https://");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId === "new") {
        await apiClient.entities.LearningResource.create(formData);
      } else {
        await apiClient.entities.LearningResource.update(editingId, formData);
      }
      cancelEdit();
      await loadResources();
    } catch (error) {
      console.error("Error saving learning resource:", error);
      alert(`Failed to save: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Remove "${resource.title}" from the Learning Websites list?`)) {
      return;
    }
    try {
      await apiClient.entities.LearningResource.delete(resource.id);
      await loadResources();
    } catch (error) {
      console.error("Error deleting learning resource:", error);
      alert(`Failed to delete: ${error.message || "Unknown error"}`);
    }
  };

  const toggleActive = async (resource) => {
    try {
      await apiClient.entities.LearningResource.update(resource.id, {
        is_active: !(resource.is_active !== false),
      });
      await loadResources();
    } catch (error) {
      console.error("Error toggling learning resource:", error);
    }
  };

  const move = async (resource, direction) => {
    const sorted = [...resources].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const index = sorted.findIndex((r) => r.id === resource.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;

    try {
      await Promise.all([
        apiClient.entities.LearningResource.update(resource.id, {
          display_order: swapWith.display_order ?? 0,
        }),
        apiClient.entities.LearningResource.update(swapWith.id, {
          display_order: resource.display_order ?? 0,
        }),
      ]);
      await loadResources();
    } catch (error) {
      console.error("Error reordering learning resources:", error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading learning resources...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Learning Websites</h1>
          <p className="text-slate-600 mt-1">
            External learning tools and websites shown in the "Learning Websites" sidebar
            section for every tutor and student. The title you set here is exactly what
            appears as the button text, so make it self-explanatory.
          </p>
        </div>

        {editingId === null && (
          <Button onClick={startCreate} className="bg-[#1565C0] hover:bg-[#1e88e5]">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        )}
      </div>

      {editingId !== null && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>{editingId === "new" ? "Add Learning Resource" : "Edit Learning Resource"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title (shown as the button text)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Explore Periodic Table"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Link</Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button onClick={cancelEdit} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {resources.length === 0 && editingId === null && (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No learning resources yet. Add one above.
            </CardContent>
          </Card>
        )}

        {resources
          .slice()
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
          .map((resource, index, sorted) => (
            <Card key={resource.id} className={resource.is_active === false ? "opacity-60" : ""}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <BookOpen className="w-5 h-5 text-[#1565C0] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">
                      {resource.title}
                      {resource.is_active === false && (
                        <span className="ml-2 text-xs text-slate-500">(hidden)</span>
                      )}
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
                    >
                      {resource.url}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(resource, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => move(resource, 1)}
                    disabled={index === sorted.length - 1}
                    title="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(resource)}
                    title={resource.is_active === false ? "Show to tutors/students" : "Hide from tutors/students"}
                  >
                    {resource.is_active === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(resource)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(resource)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
