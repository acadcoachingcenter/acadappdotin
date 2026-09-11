import React, { useState } from "react";
import { apiClient } from "@/api/apiClient";
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
import { IndianRupee } from "lucide-react";

export default function RecordTutorPaymentModal({ open, onOpenChange, onPaymentRecorded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(false);
  const [formData, setFormData] = useState({
    tutorId: "",
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "UPI",
    notes: "",
  });
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (open) {
      loadTutors();
    }
  }, [open]);

  const loadTutors = async () => {
    setIsLoadingTutors(true);
    try {
      const allUsers = await apiClient.entities.User.filter({ user_type: "tutor" });
      setTutors(Array.isArray(allUsers) ? allUsers : []);
    } catch (err) {
      console.error("Error loading tutors:", err);
    }
    setIsLoadingTutors(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.tutorId) {
      setError("Please select a tutor");
      return;
    }

    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTutor = tutors.find((t) => t.id === formData.tutorId);

      await apiClient.entities.TutorPayment.create({
        tutor_id: formData.tutorId,
        tutor_name: selectedTutor?.full_name || selectedTutor?.email || "",
        amount: amountNum,
        payment_date: formData.paymentDate,
        payment_method: formData.paymentMethod,
        notes: formData.notes,
      });

      alert("✅ Payment recorded.");

      setFormData({
        tutorId: "",
        amount: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: "UPI",
        notes: "",
      });

      onPaymentRecorded?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Error recording tutor payment:", err);
      setError(err.message || "Unable to record payment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee size={18} />
            Record Tutor Payment
          </DialogTitle>
          <DialogDescription>
            Logs a payout to a tutor so the dashboard's revenue figures reflect what's actually
            been paid out, not just fees collected.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <Label>Tutor</Label>
            <Select
              value={formData.tutorId}
              onValueChange={(val) => setFormData({ ...formData, tutorId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingTutors ? "Loading tutors..." : "Select a tutor"} />
              </SelectTrigger>
              <SelectContent>
                {tutors.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name || t.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount Paid (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 700"
            />
          </div>

          <div>
            <Label>Payment Date</Label>
            <Input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. September fortnightly payout"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
