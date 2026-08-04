import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, UserPlus, CheckCircle } from "lucide-react";

const GRADES = [
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", 
  "Class 11", "Class 12"
];

const SYLLABI = ["CBSE", "MATRIC", "STATE BOARD", "ICSE"];

export default function AddWardModal({ open, onOpenChange, onChildAdded }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    grade_class: '',
    school_name: '',
    syllabus: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccessMessage('');
  };

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setError("Student name is required.");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email ID is required.");
      return false;
    }
    if (!formData.email.includes('@')) {
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
    if (!formData.syllabus) {
      setError("Please select the syllabus.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const parent = await base44.auth.me();
      const emailLower = formData.email.toLowerCase().trim();

      // Check if user already exists
      const existingUsers = await base44.entities.User.filter({ email: emailLower });
      
      let studentId;
      
      if (existingUsers.length > 0) {
        // User exists - update and link
        const existingStudent = existingUsers[0];
        studentId = existingStudent.id;
        
        await base44.entities.User.update(existingStudent.id, {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim(),
          grade_class: formData.grade_class,
          school_name: formData.school_name.trim() || undefined,
          syllabus: formData.syllabus,
          user_type: existingStudent.user_type || 'student'
        });
        
        setSuccessMessage(`${formData.full_name} has been linked to your account!`);
      } else {
        // User doesn't exist
        setError(`Student not found. Please go to Dashboard → Data → User → Invite User and send an invitation to ${emailLower}. Once they accept, you can link them here.`);
        setIsSubmitting(false);
        return;
      }

      // Update parent's children_ids
      const currentChildren = parent.children_ids || [];
      if (!currentChildren.includes(studentId)) {
        await base44.auth.updateMe({
          children_ids: [...currentChildren, studentId]
        });
      }

      // Wait a moment to show success message
      setTimeout(() => {
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          grade_class: '',
          school_name: '',
          syllabus: ''
        });
        onChildAdded();
        onOpenChange(false);
      }, 1500);

    } catch (err) {
      console.error("Error adding child:", err);
      setError(err.message || "Failed to add child. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        setError('');
        setSuccessMessage('');
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          grade_class: '',
          school_name: '',
          syllabus: ''
        });
      }
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Your Child/Ward</DialogTitle>
          <DialogDescription>
            Fill in your child's details to link their account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="student-name" className="text-base font-semibold">
              Student Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="student-name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter student's full name"
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">
              Email ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="student@example.com"
              className="text-base"
            />
          </div>

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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade" className="text-base font-semibold">
              Class Studying <span className="text-red-500">*</span>
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

          <div className="space-y-2">
            <Label htmlFor="school" className="text-base font-semibold">
              School Name <span className="text-slate-400">(Optional)</span>
            </Label>
            <Input
              id="school"
              value={formData.school_name}
              onChange={(e) => handleInputChange('school_name', e.target.value)}
              placeholder="Enter school name"
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="syllabus" className="text-base font-semibold">
              Syllabus <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.syllabus} onValueChange={(value) => handleInputChange('syllabus', value)}>
              <SelectTrigger id="syllabus" className="text-base">
                <SelectValue placeholder="Select syllabus" />
              </SelectTrigger>
              <SelectContent>
                {SYLLABI.map(syllabus => (
                  <SelectItem key={syllabus} value={syllabus}>{syllabus}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>How it works:</strong> If the student hasn't registered yet, the admin will need to invite them through Dashboard → Data → User. Once invited, the student will receive an email and can complete their registration.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-[#1565C0] hover:bg-[#1e88e5]">
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" /> Add Child</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}