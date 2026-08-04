
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { UserPlus, Loader2, AlertTriangle } from "lucide-react";

const SUBJECTS = [
"Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
"Social Science", "Computer Science", "Economics", "Accountancy",
"Business Studies", "Sanskrit", "French", "German", "Statistics",
"Psychology", "Philosophy", "Political Science", "History", "Geography"];

export default function PromoteToTutorModal({ user, open, onOpenChange, onTutorPromoted }) {
  const [tutorData, setTutorData] = useState({
    phone: '',
    location: '',
    bio: '',
    subjects_teaching: [],
    experience_years: '',
    hourly_rate: '',
    qualifications: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setTutorData({
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        subjects_teaching: user.subjects_teaching || [],
        experience_years: user.experience_years || '',
        hourly_rate: user.hourly_rate || '',
        qualifications: user.qualifications?.join(', ') || ''
      });
    }
  }, [user]);

  const updateField = (field, value) => {
    setTutorData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const toggleSubject = (subject) => {
    setTutorData((prev) => ({
      ...prev,
      subjects_teaching: prev.subjects_teaching.includes(subject) ?
      prev.subjects_teaching.filter((s) => s !== subject) :
      [...prev.subjects_teaching, subject]
    }));
  };

  const validateForm = () => {
    const { subjects_teaching, experience_years, hourly_rate } = tutorData;
    if (subjects_teaching.length === 0) {
      setError("At least one teaching subject must be selected");
      return false;
    }
    if (!experience_years || isNaN(experience_years) || parseInt(experience_years) < 0) {
      setError("Valid experience years required");
      return false;
    }
    if (!hourly_rate || isNaN(hourly_rate) || parseInt(hourly_rate) <= 0) {
      setError("Valid hourly rate required");
      return false;
    }
    return true;
  };

  const handlePromoteTutor = async () => {
    if (!validateForm() || !user) return;

    setIsLoading(true);
    setError("");

    try {
      const updatePayload = {
        ...tutorData,
        user_type: 'tutor',
        is_verified: true, // Admin-promoted tutors are automatically verified
        experience_years: parseInt(tutorData.experience_years),
        hourly_rate: parseInt(tutorData.hourly_rate),
        qualifications: tutorData.qualifications.trim() ? tutorData.qualifications.split(',').map((q) => q.trim()).filter(Boolean) : [],
        bio: tutorData.bio.trim() || `Experienced educator with ${tutorData.experience_years}+ years of teaching experience in ${tutorData.subjects_teaching.join(', ')}.`
      };

      console.log(`Updating user ${user.id} with payload:`, updatePayload);
      await User.update(user.id, updatePayload);
      console.log("User promoted to tutor successfully");

      onTutorPromoted();

    } catch (err) {
      console.error("Error promoting tutor:", err);
      setError(`Failed to promote tutor: ${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-blue-400 p-6 fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Promote to Tutor
          </DialogTitle>
          <DialogDescription>
            Add tutor details for {user?.full_name} ({user?.email}). They will be verified and visible to students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tutor-phone">Phone</Label>
              <Input
                id="tutor-phone"
                value={tutorData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutor-location">Location</Label>
              <Input
                id="tutor-location"
                value={tutorData.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Mumbai, Maharashtra" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Experience (Years) *</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={tutorData.experience_years}
                onChange={(e) => updateField('experience_years', e.target.value)}
                placeholder="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourly-rate">Hourly Rate (₹) *</Label>
              <Input
                id="hourly-rate"
                type="number"
                min="1"
                value={tutorData.hourly_rate}
                onChange={(e) => updateField('hourly_rate', e.target.value)}
                placeholder="500" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Teaching Subjects * (Select at least one)</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
              {SUBJECTS.map((subject) =>
              <Badge
                key={subject}
                variant={tutorData.subjects_teaching.includes(subject) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSubject(subject)}>
                  {subject}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qualifications">Qualifications (comma-separated)</Label>
            <Input
              id="qualifications"
              value={tutorData.qualifications}
              onChange={(e) => updateField('qualifications', e.target.value)}
              placeholder="B.Tech, M.Tech, PhD" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={tutorData.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Brief description about the tutor's expertise..."
              className="h-20" />
          </div>
        </div>
        
        {error &&
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        }

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handlePromoteTutor}
            disabled={isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Promoting...</> : <><UserPlus className="h-4 w-4 mr-2" />Promote Tutor</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
