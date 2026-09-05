import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Save, Trash2, PlusCircle, Loader2, ExternalLink, EyeOff, Eye } from "lucide-react";

// Fixed subject list per current setup: one permanent Meet room per subject,
// shared across Class 6-12 given the current student volume. Extend this
// list if a new subject is added later.
const SUBJECTS = [
  "English",
  "Tamil",
  "Science",
  "Maths",
  "Social Science",
  "Hindi",
];

const emptyForm = {
  subject: SUBJECTS[0],
  meet_link: "",
  grade_range: "Class 6 - 12",
  display_order: 0,
  is_active: true,
};

export default function AdminClassroomLinks() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = not editing, "new" = creating
  const [formData, setFormData] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.entities.SubjectClassroom.list("display_order");
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading classroom links:", error);
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const subjectsAlreadyUsed = new Set(
    rooms.filter((r) => r.id !== editingId).map((r) => r.subject)
  );

  const startCreate = () => {
    const nextSubject = SUBJECTS.find((s) => !subjectsAlreadyUsed.has(s)) || SUBJECTS[0];
    setFormData({
      ...emptyForm,
      subject: nextSubject,
      display_order: rooms.length,
    });
    setEditingId("new");
  };

  const startEdit = (room) => {
    setFormData({
      subject: room.subject || SUBJECTS[0],
      meet_link: room.meet_link || "",
      grade_range: room.grade_range || "Class 6 - 12",
      display_order: room.display_order ?? 0,
      is_active: room.is_active !== false,
    });
    setEditingId(room.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.subject.trim()) {
      alert("Please choose a subject.");
      return;
    }
    if (!formData.meet_link.trim() || !formData.meet_link.includes("meet.google.com")) {
      alert("Please paste a valid Google Meet link (meet.google.com/...).");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId === "new") {
        await apiClient.entities.SubjectClassroom.create(formData);
      } else {
        await apiClient.entities.SubjectClassroom.update(editingId, formData);
      }
      cancelEdit();
      await loadRooms();
    } catch (error) {
      console.error("Error saving classroom link:", error);
      alert(`Failed to save: ${error.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Remove the permanent ${room.subject} classroom link?`)) {
      return;
    }
    try {
      await apiClient.entities.SubjectClassroom.delete(room.id);
      await loadRooms();
    } catch (error) {
      console.error("Error deleting classroom link:", error);
      alert(`Failed to delete: ${error.message || "Unknown error"}`);
    }
  };

  const toggleActive = async (room) => {
    try {
      await apiClient.entities.SubjectClassroom.update(room.id, {
        is_active: !(room.is_active !== false),
      });
      await loadRooms();
    } catch (error) {
      console.error("Error toggling classroom link:", error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading classroom links...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Classroom Links</h1>
          <p className="text-slate-600 mt-1">
            Permanent, subject-wise Google Meet links (Class 6–12). Students and tutors
            see these on their dashboard as a fallback if the automatic Calendar →
            WhatsApp class notification ever fails.
          </p>
        </div>

        {editingId === null && (
          <Button onClick={startCreate} className="bg-[#1565C0] hover:bg-[#1e88e5]">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Link
          </Button>
        )}
      </div>

      {editingId !== null && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>{editingId === "new" ? "Add Classroom Link" : "Edit Classroom Link"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, subject: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem
                      key={subject}
                      value={subject}
                      disabled={subjectsAlreadyUsed.has(subject)}
                    >
                      {subject}
                      {subjectsAlreadyUsed.has(subject) ? " (already has a link)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meet_link">Google Meet Link</Label>
              <Input
                id="meet_link"
                value={formData.meet_link}
                onChange={(e) => setFormData((prev) => ({ ...prev, meet_link: e.target.value }))}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
              <p className="text-xs text-slate-500">
                Paste one of your 6 permanent Meet links here. Create it once in Google
                Meet/Calendar as a recurring or nicknamed room so it never expires.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_range">Grade Range (shown to students)</Label>
              <Input
                id="grade_range"
                value={formData.grade_range}
                onChange={(e) => setFormData((prev) => ({ ...prev, grade_range: e.target.value }))}
                placeholder="Class 6 - 12"
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
        {rooms.length === 0 && editingId === null && (
          <Card>
            <CardContent className="py-8 text-center text-slate-500">
              No permanent classroom links yet. Add your 6 subject links above.
            </CardContent>
          </Card>
        )}

        {rooms.map((room) => (
          <Card key={room.id} className={room.is_active === false ? "opacity-60" : ""}>
            <CardContent className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Video className="w-5 h-5 text-[#1565C0] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {room.subject}
                    {room.is_active === false && (
                      <span className="ml-2 text-xs text-slate-500">(hidden)</span>
                    )}
                  </p>
                  <a
                    href={room.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
                  >
                    {room.meet_link}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                  {room.grade_range && (
                    <p className="text-xs text-slate-500">{room.grade_range}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(room)} title={room.is_active === false ? "Show to students" : "Hide from students"}>
                  {room.is_active === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(room)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(room)}>
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
