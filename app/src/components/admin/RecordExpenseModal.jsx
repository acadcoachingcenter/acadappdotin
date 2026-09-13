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
import { Receipt } from "lucide-react";

const EXPENSE_CATEGORIES = [
  "Marketing",
  "Pamphlets & Printing",
  "Distribution",
  "Software & Tools",
  "Rent & Utilities",
  "Other",
];

export default function RecordExpenseModal({ open, onOpenChange, onExpenseRecorded }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "Marketing",
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    vendor: "",
    paymentMethod: "UPI",
    notes: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(formData.amount);
    if (!amountNum || amountNum <= 0) {
      setError("Please enter a valid expense amount");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter a short description of the expense");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.entities.Expense.create({
        category: formData.category,
        description: formData.description,
        amount: amountNum,
        expense_date: formData.expenseDate,
        vendor: formData.vendor,
        payment_method: formData.paymentMethod,
        notes: formData.notes,
      });

      alert("✅ Expense recorded.");

      setFormData({
        category: "Marketing",
        description: "",
        amount: "",
        expenseDate: new Date().toISOString().slice(0, 10),
        vendor: "",
        paymentMethod: "UPI",
        notes: "",
      });

      onExpenseRecorded?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Error recording expense:", err);
      setError(err.message || "Unable to record expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt size={18} />
            Record Expense
          </DialogTitle>
          <DialogDescription>
            Logs a business cost (marketing, pamphlets, distribution, etc.) so the dashboard's
            net margin reflects true profit, not just fees minus tutor payouts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData({ ...formData, category: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. 500 pamphlets for Anna Nagar distribution"
            />
          </div>

          <div>
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 2500"
            />
          </div>

          <div>
            <Label>Expense Date</Label>
            <Input
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            />
          </div>

          <div>
            <Label>Vendor (optional)</Label>
            <Input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="e.g. Sri Printers"
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
              placeholder="Any additional context"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
