import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Phone } from "lucide-react";

export default function EnrollStudentModal({ open, onOpenChange, onEnrollmentSuccess, initialData }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [formData, setFormData] = useState({
    studentEmail: "",
    studentWhatsApp: "",
    studentName: "",
    tutorName: "",
    courseId: "",
    amountPaid: "",
    transactionId: "",
    remarks: ""
  });
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) {
      loadCourses();
      if (initialData) {
        setFormData({
          studentEmail: initialData.studentEmail || "",
          studentWhatsApp: initialData.studentWhatsApp || "",
          studentName: initialData.studentName || "",
          tutorName: initialData.tutorName || "",
          courseId: "",
          amountPaid: initialData.amountPaid || "",
          transactionId: initialData.transactionId || "",
          remarks: initialData.remarks || "Enrolled by admin"
        });
      }
    }
  }, [open]);

  const loadCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const publishedCourses = await base44.entities.Course.filter({ status: 'published' });
      setCourses(publishedCourses);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
    setIsLoadingCourses(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate that at least one contact method is provided
    if (!formData.studentEmail && !formData.studentWhatsApp) {
      setError("Please provide either Email ID or WhatsApp Number");
      return;
    }

    // Validate email format if provided
    if (formData.studentEmail && !formData.studentEmail.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate WhatsApp number format if provided
    if (formData.studentWhatsApp && formData.studentWhatsApp.length < 10) {
      setError("Please enter a valid WhatsApp number (minimum 10 digits)");
      return;
    }

    if (!formData.studentName) {
      setError("Please enter the student's name");
      return;
    }

    if (!formData.courseId) {
      setError("Please select a course");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCourse = courses.find(c => c.id === formData.courseId);
      
      // Use email if provided, otherwise use WhatsApp as identifier
      const contactEmail = formData.studentEmail ? 
        formData.studentEmail.toLowerCase().trim() : 
        `${formData.studentWhatsApp.replace(/\D/g, '')}@whatsapp.temp`;
      
      // Create enrollment directly (admin approval)
      const enrollmentData = {
        student_email: contactEmail,
        student_whatsapp: formData.studentWhatsApp.trim(),
        student_name: formData.studentName.trim(),
        course_id: formData.courseId,
        course_name: selectedCourse.title,
        tutor_id: selectedCourse.tutor_id,
        tutor_name: formData.tutorName.trim() || selectedCourse.tutor_name,
        amount_paid: parseFloat(formData.amountPaid) || 0,
        payment_transaction_id: formData.transactionId || "",
        status: "active", // Admin can directly activate
        enrollment_date: new Date().toISOString(),
        remarks: formData.remarks || "Enrolled by admin"
      };

      await base44.entities.Enrollment.create(enrollmentData);

      // Update course enrollment count
      await base44.entities.Course.update(formData.courseId, {
        enrolled_students: (selectedCourse.enrolled_students || 0) + 1
      });
      
      alert("✅ Student enrolled successfully!");
      
      // Reset form
      setFormData({
        studentEmail: "",
        studentWhatsApp: "",
        studentName: "",
        tutorName: "",
        courseId: "",
        amountPaid: "",
        transactionId: "",
        remarks: ""
      });
      
      if (onEnrollmentSuccess) {
        onEnrollmentSuccess();
      }
      onOpenChange(false);

    } catch (error) {
      console.error("Error enrolling student:", error);
      setError("Failed to enroll student. Please try again.");
    }

    setIsSubmitting(false);
  };

  const selectedCourse = courses.find(c => c.id === formData.courseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#1565C0]" />
            Enroll Student (Admin)
          </DialogTitle>
          <DialogDescription>
            Directly enroll students. Provide at least Email ID OR WhatsApp Number.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="courseId">Select Course *</Label>
            <Select
              value={formData.courseId}
              onValueChange={(value) => {
                const course = courses.find(c => c.id === value);
                setFormData({ 
                  ...formData, 
                  courseId: value,
                  amountPaid: course?.price || ""
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCourses ? (
                  <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                ) : courses.length === 0 ? (
                  <SelectItem value="none" disabled>No published courses available</SelectItem>
                ) : (
                  courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} - ₹{course.price}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedCourse && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="text-blue-800">
                  <strong>Subject:</strong> {selectedCourse.subject} | <strong>Grade:</strong> {selectedCourse.grade_level}
                </p>
                <p className="text-blue-700">
                  <strong>Tutor:</strong> {selectedCourse.tutor_name}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name *</Label>
            <Input
              id="studentName"
              type="text"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              placeholder="Enter student's full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutorName">Tutor / Tuition Center Name</Label>
            <Input
              id="tutorName"
              type="text"
              value={formData.tutorName}
              onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
              placeholder={selectedCourse?.tutor_name ? `Defaults to: ${selectedCourse.tutor_name}` : "Enter tutor or tuition center name"}
            />
            <p className="text-xs text-slate-500">
              {selectedCourse?.tutor_name ? "Leave blank to use the course's tutor." : "Enter the tutor or tuition center name."}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800 font-semibold mb-2">
              📱 Provide at least ONE contact method below:
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentWhatsApp" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              WhatsApp Number (Student/Parent)
            </Label>
            <Input
              id="studentWhatsApp"
              type="tel"
              value={formData.studentWhatsApp}
              onChange={(e) => setFormData({ ...formData, studentWhatsApp: e.target.value })}
              placeholder="+91 9876543210 or 9876543210"
            />
            <p className="text-xs text-slate-500">
              WhatsApp number for notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentEmail" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email ID (Student/Parent)
            </Label>
            <Input
              id="studentEmail"
              type="email"
              value={formData.studentEmail}
              onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
              placeholder="student@example.com"
            />
            <p className="text-xs text-slate-500">
              Email for login and notifications (if available)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
            <Input
              id="amountPaid"
              type="number"
              value={formData.amountPaid}
              onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
              placeholder="0"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
            <Input
              id="transactionId"
              type="text"
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              placeholder="Payment transaction ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="Add any additional notes..."
              className="h-20"
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800">
              ✅ <strong>Admin Privilege:</strong> This enrollment will be activated immediately.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#1565C0] hover:bg-[#1e88e5]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enrolling..." : "Enroll Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}