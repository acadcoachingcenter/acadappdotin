import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, ShoppingCart, X, Loader2, ExternalLink, CheckCircle } from "lucide-react";

export default function PaymentProofModal({ book, user, onClose, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.size > 10 * 1024 * 1024) {
      setError("File too large. Please upload an image under 10MB.");
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError("");
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload your payment screenshot.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      // Upload the file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Create purchase record
      await base44.entities.BookPurchase.create({
        book_id: book.id,
        book_title: book.title,
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        payment_proof_url: file_url,
        amount_paid: book.price,
        status: "pending",
        purchase_date: new Date().toISOString(),
      });

      // Send payment alert to admin
      try {
        await base44.functions.invoke('sendPaymentAlertEmail', {
          buyerName: user.full_name || user.email,
          buyerEmail: user.email,
          itemTitle: book.title,
          amountPaid: book.price,
          paymentProofUrl: file_url,
          itemType: 'Online Book'
        });
      } catch (alertError) {
        console.log('Payment alert email failed:', alertError);
      }

      onSubmitted();
    } catch (e) {
      console.error(e);
      setError("Failed to submit. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-900 text-lg">Buy "{book.title}"</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Pay */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="w-6 h-6 bg-[#1565C0] text-white rounded-full flex items-center justify-center text-xs">1</span>
              Complete Payment
            </div>
            <p className="text-sm text-slate-500 ml-8">Pay ₹{book.price} via the link below:</p>
            <a
              href={book.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-8 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Pay ₹{book.price} via PayU
            </a>
          </div>

          {/* Step 2: Upload proof */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="w-6 h-6 bg-[#1565C0] text-white rounded-full flex items-center justify-center text-xs">2</span>
              Upload Payment Screenshot
            </div>
            <p className="text-sm text-slate-500 ml-8">Take a screenshot of your payment confirmation and upload it here.</p>
            
            <div className="ml-8">
              {!previewUrl ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-[#1565C0] hover:bg-blue-50/50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">Click to upload screenshot</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              ) : (
                <div className="relative">
                  <img src={previewUrl} alt="Payment proof" className="w-full max-h-48 object-contain rounded-lg border border-slate-200" />
                  <button
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 ml-8">{error}</p>}

          {/* Step 3: Submit */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="w-6 h-6 bg-[#1565C0] text-white rounded-full flex items-center justify-center text-xs">3</span>
              Submit for Approval
            </div>
            <p className="text-sm text-slate-500 ml-8">Our admin will verify your payment and grant access immediately.</p>
          </div>

          <Button
            className="w-full bg-[#1565C0] hover:bg-[#0d3d7a] text-white gap-2 py-3"
            onClick={handleSubmit}
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Submit Payment Proof
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}