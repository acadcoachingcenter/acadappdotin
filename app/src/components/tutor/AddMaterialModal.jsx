import React, { useState, useRef } from "react";
import { StudyMaterial } from "@/entities/StudyMaterial";
import { apiClient } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, CheckCircle } from "lucide-react";

export default function AddMaterialModal({ courseId, tutorId, open, onOpenChange, onMaterialAdded }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleSubmit = async () => {
    if (!title || !file) {
      setError("Title and file are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
      if (!file_url) {
        throw new Error("File upload failed.");
      }

      const materialData = {
        course_id: courseId,
        tutor_id: tutorId,
        title,
        description,
        file_url,
        file_type: file.type,
      };

      await StudyMaterial.create(materialData);
      
      onMaterialAdded(); // Refresh the list on the parent page
      onOpenChange(false); // Close the modal

    } catch (err) {
      console.error("Failed to add material:", err);
      setError("Failed to add material. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Study Material</DialogTitle>
          <DialogDescription>
            Upload a file (PDF, DOCX, etc.) for your students.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Material Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 1 Notes"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief summary of the material"
            />
          </div>
          <div className="space-y-2">
            <Label>File *</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => fileInputRef.current.click()}
            >
              {file ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{file.name}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Select File</span>
                </>
              )}
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
            ) : "Add Material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}