import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Lock, ShoppingCart, X } from "lucide-react";
import PdfPreview from "@/components/books/PdfPreview";

export default function PreviewModal({ book, onClose, onBuy }) {
  const previewPages = book.preview_pages || Math.round((book.total_pages || 100) * 0.16);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{book.title}</h2>
            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
              <Eye className="w-3 h-3" /> Free preview — first {previewPages} pages (16%)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable: PDF pages + paywall at the end */}
        <div className="flex-1 overflow-y-auto bg-slate-300">
          <div className="py-4">
            <PdfPreview pdfUrl={book.pdf_url} previewPages={previewPages} />
          </div>

          {/* Paywall — appears right after the last preview page */}
          <div className="bg-white py-8 px-6 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-[#1565C0]" />
            </div>
            <h3 className="font-bold text-slate-800 text-xl mb-2">End of Free Preview</h3>
            <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
              You've read {previewPages} of {book.total_pages} pages. Unlock the complete book with Python projects, interview questions, MCQ quiz & more.
            </p>
            <Button
              className="bg-[#1565C0] hover:bg-[#0d3d7a] text-white gap-2 px-8 py-3 text-base"
              onClick={() => { onClose(); onBuy(book); }}
            >
              <ShoppingCart className="w-5 h-5" />
              Buy Full Book — ₹{book.price} only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}