import React from "react";
import { Button } from "@/components/ui/button";
import { X, BookOpenCheck } from "lucide-react";

export default function FullBookReader({ book, onClose }) {
  const readUrl = book.pdf_url || book.flipbook_url;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-green-50">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-5 h-5 text-green-600" />
            <div>
              <h2 className="font-bold text-slate-900 text-lg">{book.title}</h2>
              <p className="text-sm text-green-600 font-medium">Full access — enjoy your book!</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Reader */}
        <div className="flex-1 overflow-hidden bg-slate-100">
          {readUrl ? (
            <iframe
              src={readUrl}
              className="w-full h-full border-none"
              title={`Full Book: ${book.title}`}
              allow="fullscreen"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>Book content not available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}