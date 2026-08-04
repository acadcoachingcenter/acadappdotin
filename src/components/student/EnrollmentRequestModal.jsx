import React, { useState, useRef } from "react";
import { Enrollment } from "@/entities/Enrollment";
import { UploadFile } from "@/integrations/Core";
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
import { Loader2, UploadCloud, CheckCircle, ExternalLink, Copy, AlertTriangle } from "lucide-react";

export default function EnrollmentRequestModal({ course, user, open, onOpenChange, onEnrollmentSuccess }) {
  const [transactionId, setTransactionId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleSubmit = async () => {
    if (!transactionId) {
      setError("Please enter the payment transaction ID.");
      return;
    }
    if (!receiptFile) {
      setError("Please upload a payment receipt screenshot.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // 1. Upload the receipt file
      const { file_url } = await UploadFile({ file: receiptFile });
      if (!file_url) {
        throw new Error("File upload failed.");
      }

      // 2. Create the enrollment record
      const enrollmentData = {
        student_id: user.id,
        student_name: user.full_name || user.email,
        course_id: course.id,
        course_name: course.title,
        tutor_id: course.tutor_id,
        tutor_name: course.tutor_name,
        amount_paid: course.price,
        payment_transaction_id: transactionId,
        payment_receipt_url: file_url,
        status: "pending_approval",
        enrollment_date: new Date().toISOString(),
      };

      await Enrollment.create(enrollmentData);
      
      onEnrollmentSuccess();
    } catch (err) {
      console.error("Enrollment failed:", err);
      setError("Enrollment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setError("");
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText("akr.karunanithi@okhdfcbank");
    alert("UPI ID copied to clipboard!");
  };
  
  const isOfferActive = course?.original_price && new Date() < new Date("2025-10-31T23:59:59Z");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enrollment Request for: {course?.title}</DialogTitle>
          <DialogDescription>
            Make payment first, then submit the details below for approval.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isOfferActive && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <h4 className="font-bold text-red-800">Limited Time Offer!</h4>
                <p className="text-sm text-red-700">You're getting this course at a special discounted price.</p>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-100 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-600">Tutor:</span>
                <span className="font-bold text-slate-900">{course?.tutor_name}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="font-medium text-slate-600">Amount to Pay:</span>
                {isOfferActive ? (
                  <div className="text-right">
                    <del className="text-sm text-slate-500">₹{course?.original_price}</del>
                    <span className="font-bold text-xl text-red-600 ml-2">₹{course?.price}</span>
                  </div>
                ) : (
                  <span className="font-bold text-xl text-green-600">₹{course?.price}</span>
                )}
            </div>
          </div>

          {/* Payment Options */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Make Payment Using:</h4>
            
            {/* Payment Gateway Link */}
            <div className="mb-3">
              <Button 
                variant="outline" 
                className="w-full justify-between bg-white border-blue-300 hover:bg-blue-50"
                onClick={() => window.open("https://pmny.in/xJuAmT6XgxX7", "_blank")}
              >
                <span className="font-medium">💳 Pay via Payment Gateway</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            
            {/* UPI ID */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white p-2 rounded border border-blue-300">
                <div className="text-xs text-blue-600 font-medium">UPI ID:</div>
                <div className="font-mono text-sm">akr.karunanithi@okhdfcbank</div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={copyUpiId}
                className="border-blue-300 hover:bg-blue-50"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-xs text-blue-600 mt-2">
              💡 After payment, enter transaction ID and upload screenshot below
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">Payment Transaction ID *</Label>
            <Input
              id="transactionId"
              value={transactionId}
              onChange={(e) => { setTransactionId(e.target.value); setError(""); }}
              placeholder="Enter ID from your payment app (e.g., UPI, GPay)"
            />
          </div>
          <div className="space-y-2">
            <Label>Payment Receipt Screenshot *</Label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
            />
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={() => fileInputRef.current.click()}
            >
              {receiptFile ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{receiptFile.name}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Screenshot</span>
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
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : "Submit for Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}