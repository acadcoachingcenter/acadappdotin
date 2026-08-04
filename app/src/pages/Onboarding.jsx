
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", 
  "Social Science", "Computer Science", "Economics", "Accountancy", 
  "Business Studies", "Yoga"
];

const GRADES = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", 
  "Class 11", "Class 12", "Undergraduate", "Graduate"
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    user_type: "",
    phone: "",
    location: "",
    grade_class: "",
    subjects_interested: [],
    subjects_teaching: [],
    qualifications: [],
    experience_years: "",
    hourly_rate: "",
    bio: ""
  });

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData.user_type) {
        navigateToDashboard(userData.user_type);
        return;
      }
    } catch (error) {
      navigate(createPageUrl('Welcome'));
    }
    setIsLoading(false);
  };

  const navigateToDashboard = (userType) => {
    switch(userType) {
      case 'student':
        navigate(createPageUrl('StudentDashboard'));
        break;
      case 'parent':
        navigate(createPageUrl('ParentDashboard'));
        break;
      case 'tutor':
        navigate(createPageUrl('TutorDashboard'));
        break;
      case 'admin':
        navigate(createPageUrl('AdminDashboard'));
        break;
      default:
        navigate(createPageUrl('StudentDashboard'));
    }
  };

  const handleOnboardingSubmit = async () => {
    try {
      await User.updateMyUserData(formData);
      const updatedUser = await User.me();
      navigateToDashboard(updatedUser.user_type);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#1565C0] mx-auto"></div>
          <p className="mt-4 text-slate-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          /* Global dropdown fix for onboarding page */
          .onboarding-page [data-radix-select-content] {
            background: #FFFFFF !important;
            border: 2px solid #e2e8f0 !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2) !important;
            z-index: 99999 !important;
            backdrop-filter: none !important;
            opacity: 1 !important;
          }
          
          .onboarding-page [data-radix-select-item] {
            background: #FFFFFF !important;
            color: #1e293b !important;
            font-weight: 500 !important;
            padding: 12px 16px !important;
            opacity: 1 !important;
          }
          
          .onboarding-page [data-radix-select-item]:hover {
            background: #1565C0 !important;
            color: #FFFFFF !important;
          }
          
          .onboarding-page [data-radix-select-trigger] {
            background: #FFFFFF !important;
            border: 2px solid #e2e8f0 !important;
            color: #1e293b !important;
          }
          
          .onboarding-page [data-radix-select-trigger]:focus {
            border-color: #1565C0 !important;
          }
        `}
      </style>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 onboarding-page">
        <Card className="w-full max-w-2xl shadow-xl bg-white">
          <CardHeader className="text-center bg-gradient-to-r from-[#1565C0] to-blue-700 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Welcome to ACAD!</CardTitle>
            <p className="text-blue-100">Let's set up your profile to get started</p>
          </CardHeader>
          <CardContent className="space-y-6 p-8 bg-white">
            <div className="space-y-2">
              <Label className="text-slate-800 font-medium">I am a...</Label>
              <select 
                value={formData.user_type} 
                onChange={(e) => updateFormData('user_type', e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-md bg-white text-slate-900 font-medium focus:border-[#1565C0] focus:outline-none"
              >
                <option value="">Select your role</option>
                <option value="student">Student - Join Classes & Learn</option>
                <option value="parent">Parent - Monitor Child's Progress</option>
                <option value="tutor">Tutor - Teach & Upload Content</option>
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-800 font-medium">Phone Number</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="bg-white border-2 border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-800 font-medium">Location</Label>
                <Input 
                  value={formData.location} 
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="City, State"
                  className="bg-white border-2 border-slate-200"
                />
              </div>
            </div>

            {formData.user_type === 'student' && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-800 font-medium">Current Grade/Class</Label>
                  <select 
                    value={formData.grade_class} 
                    onChange={(e) => updateFormData('grade_class', e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-md bg-white text-slate-900 font-medium focus:border-[#1565C0] focus:outline-none"
                  >
                    <option value="">Select your grade</option>
                    {GRADES.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-800 font-medium">Subjects Interested</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-slate-50 p-3 rounded-md border-2">
                    {SUBJECTS.map(subject => (
                      <label key={subject} className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          checked={formData.subjects_interested?.includes(subject)}
                          onChange={(e) => {
                            const current = formData.subjects_interested || [];
                            const updated = e.target.checked 
                              ? [...current, subject]
                              : current.filter(s => s !== subject);
                            updateFormData('subjects_interested', updated);
                          }}
                        />
                        <span className="text-sm text-slate-800">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {formData.user_type === 'tutor' && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-800 font-medium">Experience (Years)</Label>
                    <Input 
                      type="number"
                      value={formData.experience_years} 
                      onChange={(e) => updateFormData('experience_years', e.target.value)}
                      placeholder="5"
                      className="bg-white border-2 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-800 font-medium">Hourly Rate (₹)</Label>
                    <Input 
                      type="number"
                      value={formData.hourly_rate} 
                      onChange={(e) => updateFormData('hourly_rate', e.target.value)}
                      placeholder="500"
                      className="bg-white border-2 border-slate-200"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-800 font-medium">Subjects Teaching</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-slate-50 p-3 rounded-md border-2">
                    {SUBJECTS.map(subject => (
                      <label key={subject} className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          checked={formData.subjects_teaching?.includes(subject)}
                          onChange={(e) => {
                            const current = formData.subjects_teaching || [];
                            const updated = e.target.checked 
                              ? [...current, subject]
                              : current.filter(s => s !== subject);
                            updateFormData('subjects_teaching', updated);
                          }}
                        />
                        <span className="text-sm text-slate-800">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-slate-800 font-medium">Bio</Label>
              <Textarea 
                value={formData.bio} 
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="h-20 bg-white border-2 border-slate-200"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleOnboardingSubmit} 
                className="flex-1 bg-[#1565C0] hover:bg-[#1e88e5] text-white font-semibold py-6"
                disabled={!formData.user_type}
              >
                Complete Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
