import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Lock, Eye, ShoppingCart, CheckCircle, Clock, XCircle, BookOpenCheck } from "lucide-react";

export default function BookCard({ book, purchase, onPreview, onBuy, onReadFull }) {
  const previewPercent = book.preview_pages && book.total_pages
    ? Math.round((book.preview_pages / book.total_pages) * 100)
    : 16;

  const status = purchase?.status;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border border-slate-200">
      <div className="bg-gradient-to-br from-[#1565C0] to-[#0d3d7a] p-6 text-white relative">
        <Badge className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 font-bold text-sm px-3 py-1">
          ₹{book.price} only
        </Badge>
        <div className="flex items-start gap-4">
          <div className="w-16 h-20 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-lg leading-tight">{book.title}</h3>
            {book.author && <p className="text-blue-200 text-sm mt-1">{book.author}</p>}
            <div className="flex items-center gap-2 mt-2">
              {book.subject && <Badge className="bg-white/20 text-white text-xs">{book.subject}</Badge>}
              {book.grade_level && <Badge className="bg-white/20 text-white text-xs">{book.grade_level}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{book.description}</p>

        {/* Preview progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {previewPercent}% free preview</span>
            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {100 - previewPercent}% premium</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${previewPercent}%` }} />
          </div>
        </div>

        {book.total_pages && (
          <p className="text-xs text-slate-400">
            {book.total_pages} pages total · Free preview: {book.preview_pages || Math.round(book.total_pages * 0.16)} pages
          </p>
        )}

        {/* Status badge if purchase exists */}
        {status === "pending" && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium p-2 rounded-lg">
            <Clock className="w-4 h-4" /> Payment proof submitted — awaiting admin approval
          </div>
        )}
        {status === "approved" && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm font-medium p-2 rounded-lg">
            <CheckCircle className="w-4 h-4" /> Access granted — full book unlocked
          </div>
        )}
        {status === "rejected" && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm font-medium p-2 rounded-lg">
            <XCircle className="w-4 h-4" /> Payment not verified — please try again
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => onPreview(book)}
          >
            <Eye className="w-4 h-4" />
            Read Preview
          </Button>

          {status === "approved" ? (
            <Button
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onReadFull(book)}
            >
              <BookOpenCheck className="w-4 h-4" />
              Read Full Book
            </Button>
          ) : (
            <Button
              className="flex-1 gap-2 bg-[#1565C0] hover:bg-[#0d3d7a] text-white"
              onClick={() => onBuy(book)}
            >
              <ShoppingCart className="w-4 h-4" />
              {status === "pending" ? "Re-submit" : `Buy ₹${book.price}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}