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
import { UserPlus, Mail, Phone, DollarSign, FileText } from "lucide-react";

export default function AddStudentModal({ open, onOpenChange, course, onStudentAdded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentEmail: "",
    studentWhatsApp: "",
    studentName: "",
    amountPaid: course?.price || "",
    transactionId: "",
    remarks: ""
  });
  const [error, setError] = useState("");

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

    setIsSubmitting(true);

    try {
      const user = await base44.auth.me();
      
      // Use email if provided, otherwise use WhatsApp as identifier
      const contactEmail = formData.studentEmail ? 
        formData.studentEmail.toLowerCase().trim() : 
        `${formData.studentWhatsApp.replace(/\D/g, '')}@whatsapp.temp`;
      
      // Create enrollment request
      const enrollmentData = {
        student_email: contactEmail,
        student_whatsapp: formData.studentWhatsApp.trim(),
        student_name: formData.studentName.trim(),
        course_id: course.id,
        course_name: course.title,
        tutor_id: user.id,
        tutor_name: user.full_name || user.email,
        amount_paid: parseFloat(formData.amountPaid) || 0,
        payment_transaction_id: formData.transactionId || "",
        status: "pending_approval",
        enrollment_date: new Date().toISOString(),
        remarks: formData.remarks || "Enrollment request created by tutor"
      };

      await base44.entities.Enrollment.create(enrollmentData);
      
      alert("✅ Enrollment request submitted successfully! It will be reviewed by the admin.");
      
      // Reset form
      setFormData({
        studentEmail: "",
        studentWhatsApp: "",
        studentName: "",
        amountPaid: course?.price || "",
        transactionId: "",
        remarks: ""
      });
      
      if (onStudentAdded) {
        onStudentAdded();
      }
      onOpenChange(false);

    } catch (error) {
      console.error("Error creating enrollment:", error);
      setError("Failed to create enrollment request. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#1565C0]" />
            Add Student to Course
          </DialogTitle>
          <DialogDescription>
            Enter student's or parent's details. Provide at least Email ID OR WhatsApp Number.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Course:</strong> {course?.title}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Price:</strong> ₹{course?.price?.toLocaleString()}
            </p>
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
              WhatsApp number for notifications and communication
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
            <Label htmlFor="amountPaid" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount Paid (₹)
            </Label>
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
            <Label htmlFor="remarks" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Remarks (Optional)
            </Label>
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
              📋 <strong>Note:</strong> This request will be sent to admin for approval. 
              Once approved, student will be notified via provided contact.
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
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}