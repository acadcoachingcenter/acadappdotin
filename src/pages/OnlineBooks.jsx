import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2 } from "lucide-react";
import BookCard from "@/components/books/BookCard";
import PreviewModal from "@/components/books/PreviewModal";
import PaymentProofModal from "@/components/books/PaymentProofModal";
import FullBookReader from "@/components/books/FullBookReader";
import BookReleaseBanner from "@/components/welcome/BookReleaseBanner";

export default function OnlineBooks() {
  const [books, setBooks] = useState([]);
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: null, book: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const all = await base44.entities.OnlineBook.filter({ is_published: true });
      setBooks(all);

      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const userPurchases = await base44.entities.BookPurchase.filter({ user_id: userData.id });
        setPurchases(userPurchases);
      } catch (e) {
        // User not logged in — that's fine, they can preview
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Hardcoded Tamil AI for Small Businesses book
  const tamilAIBook = {
    id: "ai-for-small-businesses-tamil",
    title: "சிறு தொழில்களுக்கான செயற்கை நுண்ணறிவு (AI)",
    author: "Dr. Karunanithi Rajamanickam",
    description: "உங்கள் சிறு தொழிலை AI மூலம் வளர்க்கும் முழுமையான தமிழ் வழிகாட்டி. 25 அத்தியாயங்கள், 100 AI Prompts, 20 AI கருவிகள், 11 வணிக உதாரணங்கள், மற்றும் 30-நாள் Action Plan உள்ளடங்கியுள்ளது.",
    pdf_url: "https://media.base44.com/files/public/689c76e2ab454d53f6e29bd5/589d37df8_AI_for_Small_Businesses_Tamil.pdf",
    flipbook_url: null,
    preview_flipbook_url: null,
    preview_pages: 7,
    total_pages: 39,
    price: 29,
    payment_link: "https://pmny.in/xJuAmT6XgxX7",
    subject: "செயற்கை நுண்ணறிவு (AI)",
    grade_level: "சிறு தொழில் உரிமையாளர்கள்",
    is_published: true,
  };

  // Hardcoded RAG book
  const ragBook = {
    id: "rag-for-beginners",
    title: "Beginner's Guide to RAG",
    author: "Dr. Karunanithi Rajamanickam",
    description: "A Complete Beginner-to-Practitioner Guide to Retrieval Augmented Generation, Vector Databases, and LLM Applications. 56 pages with Python projects, 60 interview questions, MCQ quiz, and more.",
    pdf_url: "https://media.base44.com/files/public/689c76e2ab454d53f6e29bd5/f11f8cf80_RAG-for-Beginners-ACAD.pdf",
    flipbook_url: "https://flipbook.acadapp.in",
    preview_flipbook_url: "https://flipbook.acadapp.in",
    preview_pages: 9,
    total_pages: 56,
    price: 29,
    payment_link: "https://pmny.in/xJuAmT6XgxX7",
    subject: "Artificial Intelligence",
    grade_level: "Students & Professionals",
    is_published: true,
  };

  const allBooks = [ragBook, tamilAIBook, ...books];

  const getPurchase = (bookId) => purchases.find((p) => p.book_id === bookId);

  const handleBuy = (book) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    setModal({ type: "payment", book });
  };

  const handleReadFull = (book) => {
    setModal({ type: "reader", book });
  };

  const handlePaymentSubmitted = () => {
    setModal({ type: null, book: null });
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">ACAD Online Books</h1>
        <p className="text-slate-500">Read the first 16% free — pay to unlock the complete book</p>
      </div>

      <BookReleaseBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            purchase={getPurchase(book.id)}
            onPreview={(b) => setModal({ type: "preview", book: b })}
            onBuy={handleBuy}
            onReadFull={handleReadFull}
          />
        ))}
      </div>

      {allBooks.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No books available yet.</p>
        </div>
      )}

      {/* Modals */}
      {modal.type === "preview" && (
        <PreviewModal book={modal.book} onClose={() => setModal({ type: null, book: null })} onBuy={handleBuy} />
      )}
      {modal.type === "payment" && (
        <PaymentProofModal book={modal.book} user={user} onClose={() => setModal({ type: null, book: null })} onSubmitted={handlePaymentSubmitted} />
      )}
      {modal.type === "reader" && (
        <FullBookReader book={modal.book} onClose={() => setModal({ type: null, book: null })} />
      )}
    </div>
  );
}