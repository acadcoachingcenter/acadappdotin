import React, { useState, useRef } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, GraduationCap, Loader2 } from "lucide-react";

const GRADES = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", 
  "Class 11", "Class 12"
];

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", 
  "Hindi", "Social Science", "Computer Science", "All Subjects"
];

export default function RegisterInquiry() {
  const [formData, setFormData] = useState({
    student_name: '',
    parent_name: '',
    email: '',
    phone: '',
    grade_class: '',
    subjects_interested: [],
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  // Synchronous lock. State (isSubmitting) only blocks the button after a
  // re-render, so a fast double-click/double-tap can still fire handleSubmit
  // twice before that render happens, creating duplicate Inquiry rows. A ref
  // updates instantly, so the second call is rejected immediately.
  const submitLockRef = useRef(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => {
      const current = prev.subjects_interested || [];
      const updated = current.includes(subject)
        ? current.filter(s => s !== subject)
        : [...current, subject];
      return { ...prev, subjects_interested: updated };
    });
  };

  const validateForm = () => {
    if (!formData.student_name.trim()) {
      setError("Student name is required.");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Contact number is required.");
      return false;
    }
    if (!formData.grade_class) {
      setError("Please select the class/grade.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLockRef.current) {
      return; // A submission is already in flight; ignore the repeat click.
    }

    if (!validateForm()) {
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      // First, save the inquiry to database (this is guaranteed to work)
      const inquiryData = {
        student_name: formData.student_name,
        parent_name: formData.parent_name || '',
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        grade_class: formData.grade_class,
        subjects_interested: formData.subjects_interested,
        message: formData.message || '',
        status: 'new',
        inquiry_date: new Date().toISOString()
      };

      await apiClient.entities.Inquiry.create(inquiryData);

      // Send Gmail-backed alert to admin (works for any recipient address)
      try {
        await apiClient.functions.invoke('sendInquiryAlertEmail', {
          studentName: formData.student_name,
          parentName: formData.parent_name,
          email: formData.email,
          phone: formData.phone,
          gradeClass: formData.grade_class,
          subjects: formData.subjects_interested,
          message: formData.message
        });
      } catch (alertError) {
        console.log("Admin alert email failed, but inquiry was saved:", alertError);
      }

      // Send confirmation email to the student/parent (registered users only)
      try {
        await apiClient.integrations.Core.SendEmail({
          from_name: "ACAD Team",
          to: formData.email,
          subject: "Welcome to ACAD - Registration Received! 🎉",
          body: `Dear ${formData.parent_name || formData.student_name},

Thank you for your interest in ACAD online tuition!

✅ We have successfully received your registration inquiry for ${formData.grade_class}.

📚 Subjects: ${formData.subjects_interested.join(', ') || 'To be discussed'}

Our team will contact you within 24 hours on ${formData.phone} to discuss:
• Course details and personalized learning plan
• Class schedule options
• Fees and payment options  
• FREE demo class booking

📞 For immediate assistance, feel free to contact us:
WhatsApp: +91 9790818436
Email: acadcoachingcenter@gmail.com

We look forward to helping ${formData.student_name} excel academically!

Best regards,
ACAD Team
🎓 Quality Online Education`
        });
      } catch (emailError) {
        console.log("Confirmation email failed, but inquiry was saved:", emailError);
      }

      setIsSuccess(true);
      setFormData({
        student_name: '',
        parent_name: '',
        email: '',
        phone: '',
        grade_class: '',
        subjects_interested: [],
        message: ''
      });

    } catch (err) {
      console.error("Failed to submit inquiry:", err);
      setError(`Submission failed. Please contact us directly at +91 9790818436 or acadcoachingcenter@gmail.com`);
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Successful! 🎉</h2>
            <p className="text-slate-600 mb-4">
              Thank you for registering with ACAD!
            </p>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✅ Your inquiry has been received<br/>
                📧 Confirmation sent to your email<br/>
                📞 We'll call you shortly at {formData.phone}
              </p>
            </div>
            <Button onClick={() => setIsSuccess(false)} className="bg-[#1565C0] hover:bg-[#1e88e5]">
              Submit Another Inquiry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="text-center bg-gradient-to-r from-[#1565C0] to-blue-700 text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl">📱 Quick Registration</CardTitle>
            <CardDescription className="text-blue-100">
              Fill in the form below and our team will contact you shortly
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Name */}
              <div className="space-y-2">
                <Label htmlFor="student-name" className="text-base font-semibold">
                  Student Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="student-name"
                  value={formData.student_name}
                  onChange={(e) => handleInputChange('student_name', e.target.value)}
                  placeholder="Enter student's full name"
                  className="text-base"
                  required
                />
              </div>

              {/* Parent Name */}
              <div className="space-y-2">
                <Label htmlFor="parent-name" className="text-base font-semibold">
                  Parent/Guardian Name <span className="text-slate-400">(Optional)</span>
                </Label>
                <Input
                  id="parent-name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                  placeholder="Enter parent's name"
                  className="text-base"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-semibold">
                  Email ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="student@example.com or parent@example.com"
                  className="text-base"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base font-semibold">
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="text-base"
                  required
                />
              </div>

              {/* Grade/Class */}
              <div className="space-y-2">
                <Label htmlFor="grade" className="text-base font-semibold">
                  Class/Grade <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.grade_class} onValueChange={(value) => handleInputChange('grade_class', value)}>
                  <SelectTrigger id="grade" className="text-base">
                    <SelectValue placeholder="Select class/grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Subjects Interested In</Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50">
                  {SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleSubjectToggle(subject)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        formData.subjects_interested.includes(subject)
                          ? 'bg-[#1565C0] text-white'
                          : 'bg-white text-slate-700 border hover:border-[#1565C0]'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-base font-semibold">
                  Additional Message <span className="text-slate-400">(Optional)</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Any specific requirements or questions..."
                  className="h-24"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1565C0] hover:bg-[#1e88e5] text-lg py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Registration"
                )}
              </Button>

              <p className="text-xs text-center text-slate-500">
                By submitting, you agree to receive communication from ACAD regarding your inquiry.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}