import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { TuitionRequest } from '@/entities/TuitionRequest';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getUserLocation } from "@/lib/getUserLocation";
import { AlertCircle, ClipboardPlus, LocateFixed, Loader2 } from 'lucide-react';

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
  "Social Science", "Computer Science", "Economics", "Accountancy",
  "Business Studies", "Yoga"
];

const GRADES = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12", "Undergraduate", "Graduate"
];

export default function PostTuitionRequest() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    student_grade: "",
    subjects: [],
    location: "",
    address_details: "",
    additional_details: "",
    latitude: null,
    longitude: null,
    travel_radius_km: 5
  });
  const [locating, setLocating] = useState(false);

  const useGPS = async () => {
    setLocating(true);
    try {
      const { lat, lng } = await getUserLocation();
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    } catch (e) {
      alert("Could not get location: " + e.message + "\n\nTip: Allow location permission, or enter your area in the Location field above.");
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        if (userData.user_type !== 'parent') {
          navigate(createPageUrl("Welcome"));
        }
      } catch (error) {
        navigate(createPageUrl("Welcome"));
      }
    };
    fetchUser();
  }, [navigate]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const toggleSubject = (subject) => {
    const currentSubjects = formData.subjects;
    const updatedSubjects = currentSubjects.includes(subject)
      ? currentSubjects.filter(s => s !== subject)
      : [...currentSubjects, subject];
    updateField('subjects', updatedSubjects);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_grade || formData.subjects.length === 0 || !formData.location) {
      setError("Please fill in all required fields: Grade, Subjects, and Location.");
      return;
    }
    
    setIsSaving(true);
    setError("");
    
    try {
      await TuitionRequest.create({
        ...formData,
        parent_id: user.id,
        parent_name: user.full_name || user.email,
        status: 'open'
      });
      
      alert("Your tuition request has been posted successfully!");
      navigate(createPageUrl("MyTuitionRequests"));
    } catch (err) {
      console.error("Failed to post request:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <ClipboardPlus className="w-8 h-8 text-[#1565C0]" />
        <h1 className="text-3xl font-bold text-slate-900">Post a Home Tuition Request</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Tuition Requirements</CardTitle>
            <CardDescription>Fill out the details below. Nearby tutors will be able to see your request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="grade">Student's Grade/Class *</Label>
                <select id="grade" value={formData.student_grade} onChange={e => updateField('student_grade', e.target.value)} className="w-full p-2 border rounded-md">
                  <option value="">Select Grade</option>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (City/Area) *</Label>
                <Input id="location" value={formData.location} onChange={e => updateField('location', e.target.value)} placeholder="e.g., Koramangala, Bangalore" />
              </div>

              <div className="space-y-2">
                <Label>Pin your location (helps nearby tutors find you)</Label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={useGPS} disabled={locating} className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-slate-50 disabled:opacity-50">
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                    Use GPS
                  </button>
                  {formData.latitude != null && (
                    <span className="text-xs text-slate-500">
                      Pinned: {Number(formData.latitude).toFixed(4)}, {Number(formData.longitude).toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Subjects Needed *</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg">
                {SUBJECTS.map(subject => (
                  <button type="button" key={subject} onClick={() => toggleSubject(subject)} className={`px-3 py-1 text-sm rounded-full border ${formData.subjects.includes(subject) ? 'bg-[#1565C0] text-white border-[#1565C0]' : 'bg-white'}`}>
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Specific Address (Optional)</Label>
              <Input id="address" value={formData.address_details} onChange={e => updateField('address_details', e.target.value)} placeholder="Apartment name, street, etc. (Shared only with confirmed tutors)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Additional Details</Label>
              <Textarea id="details" value={formData.additional_details} onChange={e => updateField('additional_details', e.target.value)} placeholder="e.g., Preferred timings, student's specific needs, etc." />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Posting..." : "Post Request"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}