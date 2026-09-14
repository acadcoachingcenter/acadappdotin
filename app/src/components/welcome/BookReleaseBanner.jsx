import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function BookReleaseBanner() {
  const [showBooks, setShowBooks] = useState(false);

  const featuredBooks = [
    {
      id: 1,
      title: "PHYSICS XII CBSE QUICK REVISION GUIDE",
      description: "Fast, confident revision for Boards, JEE, and NEET with key concepts, formulas, and exam-ready theory.",
      category: "CBSE Class 12 Physics",
      link: "https://play.google.com/store/books/details?id=FZe-EQAAQBAJ",
      price: "₹149"
    },
    {
      id: 2,
      title: "Grade 10 CBSE Science - Quick Revision Guide",
      description: "Complete Physics, Chemistry, and Biology revision with NCERT-aligned content, exam tips, and key formulas.",
      category: "CBSE Class 10 Science",
      link: "https://play.google.com/store/books/details?id=wc-xEQAAQBAJ",
      price: "₹99"
    },
    {
      id: 3,
      title: "MRI – Optimizing Pulse Sequences for Advanced Imaging Protocols",
      description: "Bridge the gap between MRI physics and protocol optimization for radiologists, technologists, and researchers.",
      category: "Medical Imaging",
      link: "https://play.google.com/store/books/details?id=KZuuEQAAQBAJ",
      price: "₹999"
    },
    {
      id: 4,
      title: "திருக்குறளில் எண்ணும் நெறியும்",
      description: "A numerical journey through Thirukkural - exploring mathematical philosophy in Thiruvalluvar's ethics.",
      category: "Tamil Literature",
      link: "https://play.google.com/store/books/details?id=6s-2EQAAQBAJ",
      price: "₹99"
    },
    {
      id: 5,
      title: "Electronic Sensors in Medical Application",
      description: "Fundamentals to clinical use, data integration, and future trends in medical sensor technology.",
      category: "Medical Technology",
      link: "https://play.google.com/store/books/details?id=p6y7EQAAQBAJ",
      price: "₹599"
    },
    {
      id: 6,
      title: "NEET Biology Class XI - Complete Revision Guide",
      description: "Exam-oriented study companion covering all 19 chapters of Class XI Biology with a proven 9-section format for each chapter.",
      category: "NEET / Class XI Biology",
      link: "https://play.google.com/store/books/details?id=-B7JEQAAQBAJ",
      price: "₹69"
    },
    {
      id: 7,
      title: "NEET Physics Class XI - Complete Revision Guide",
      description: "Derivation-focused, formula-dense guide covering all 15 chapters of Class XI Physics tailored for JEE Main, JEE Advanced, and NEET-UG.",
      category: "NEET / Class XI Physics",
      link: "https://play.google.com/store/books/details?id=CCrJEQAAQBAJ",
      price: "₹49"
    },
    {
      id: 8,
      title: "NEET JEE Vetri Paathai (Tamil)",
      description: "A practical Tamil guide for NEET and JEE aspirants covering application procedures, eligibility, fee structure, exam pattern, and preparation strategies.",
      category: "NEET / JEE (Tamil)",
      link: "https://play.google.com/store/books/details?id=vVLHEQAAQBAJ",
      price: "₹39"
    },
    {
      id: 9,
      title: "Chemistry XII Quick Revision Guide - Volume 1",
      description: "Comprehensive handbook for Class XII students covering Electrochemistry, Kinetics, Coordination Compounds, Organic Chemistry, and Surface Chemistry.",
      category: "CBSE Class 12 Chemistry",
      link: "https://play.google.com/store/books/details?id=ia_BEQAAQBAJ",
      price: "₹97"
    },
    {
      id: 10,
      title: "Chemistry XII Quick Revision Guide - Volume 2",
      description: "Focused revision companion for Organic Chemistry: Haloalkanes, Alcohols, Aldehydes, Ketones, Amines, and Biomolecules with exam-style questions and memory aids.",
      category: "CBSE Class 12 Chemistry",
      link: "https://play.google.com/store/books/details?id=lfvBEQAAQBAJ",
      price: "₹89"
    },
    {
      id: 11,
      title: "Biology XII CBSE Quick Revision Guide",
      description: "Exam-oriented guide transforming the entire Class XII Biology syllabus into high-scoring content with all 13 chapters, memory aids, and concept maps.",
      category: "CBSE Class 12 Biology",
      link: "https://play.google.com/store/books/details?id=DBHBEQAAQBAJ",
      price: "₹129"
    },
    {
      id: 12,
      title: "Physics Class Notes Grade XI CBSE Vol-1",
      description: "Concise, exam-focused revision companion as per latest CBSE syllabus with crisp theory, essential definitions, key formulas, and important derivations.",
      category: "CBSE Class 11 Physics",
      link: "https://play.google.com/store/books/details?id=sNjjEQAAQBAJ",
      price: "₹29"
    },
    {
      id: 13,
      title: "Physics Class Notes Grade XI CBSE Vol-2",
      description: "Continuation of structured Class XI Physics notes with simplified explanations, formula sheets, and concept-based insights for JEE and NEET.",
      category: "CBSE Class 11 Physics",
      link: "https://play.google.com/store/books/details?id=H-jjEQAAQBAJ",
      price: "₹29"
    },
    {
      id: 14,
      title: "Chemistry Class Notes - Grade XI CBSE",
      description: "Chapter-wise class notes for Class XI Chemistry with simplified explanations, key formulas, reactions, comparison tables, and quick revision points.",
      category: "CBSE Class 11 Chemistry",
      link: "https://play.google.com/store/books/details?id=7E3GEQAAQBAJ",
      price: "₹75"
    },
    {
      id: 15,
      title: "Mathematics Class Notes - Grade X CBSE",
      description: "Structured exam companion for CBSE Class X Mathematics with chapter-wise notes, theorems, identities, and step-by-step concept explanations.",
      category: "CBSE Class 10 Mathematics",
      link: "https://play.google.com/store/books/details?id=LaHFEQAAQBAJ",
      price: "₹49"
    },
    {
      id: 16,
      title: "Mathematics Class Notes - Grade XI CBSE Volume I",
      description: "Structured companion for Class XI Mathematics covering algebra, trigonometry, complex numbers, inequalities, and coordinate geometry with derivations.",
      category: "CBSE Class 11 Mathematics",
      link: "https://play.google.com/store/books/details?id=v7HFEQAAQBAJ",
      price: "₹45"
    },
    {
      id: 17,
      title: "Mathematics Class Notes - Grade XI CBSE Volume II",
      description: "Continuation covering advanced algebra, statistics, probability, straight lines, conic sections, and limits with comparison tables and revision points.",
      category: "CBSE Class 11 Mathematics",
      link: "https://play.google.com/store/books/details?id=muzFEQAAQBAJ",
      price: "₹45"
    },
    {
      id: 18,
      title: "Biology Class Notes Volume I - Grade XI CBSE",
      description: "Concise exam-oriented study guide for Class XI Biology covering diversity of living organisms, plant and animal structures, and biological principles.",
      category: "CBSE Class 11 Biology",
      link: "https://play.google.com/store/books/details?id=XdHGEQAAQBAJ",
      price: "₹48"
    },
    {
      id: 19,
      title: "Biology Class Notes Volume II - Grade XI CBSE",
      description: "Focuses on fundamental biological processes governing living organisms with structured notes, key definitions, diagrams, and essential terms.",
      category: "CBSE Class 11 Biology",
      link: "https://play.google.com/store/books/details?id=SEvHEQAAQBAJ",
      price: "₹48"
    },
    {
      id: 20,
      title: "Medical Imaging Science Vol 1",
      description: "Foundations of light, radiation, and medical imaging - optics, laser physics, radiation physics, and X-ray based imaging for biomedical sciences.",
      category: "Medical Imaging",
      link: "https://play.google.com/store/books/details?id=YkbFEQAAQBAJ",
      price: "₹95"
    },
    {
      id: 21,
      title: "Medical Imaging Science - Volume 2",
      description: "Advanced imaging, bioelectrical signals, and laboratory techniques - MRI, ultrasound, nuclear medicine, ECG/EEG/EMG, and practical measurement physics.",
      category: "Medical Imaging",
      link: "https://play.google.com/store/books/details?id=603FEQaAQBAJ",
      price: "₹85"
    },
    {
      id: 22,
      title: "A Bicycle and a Life (Tamil)",
      description: "A reflective Tamil literary work exploring life's journey, choices, and meaning through an introspective narrative.",
      category: "Tamil Literature",
      link: "https://play.google.com/store/books/details?id=ChTAEQAAQBAJ",
      price: "₹49"
    }
  ];

  return (
    <section className="py-10 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl my-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold border-0 mb-3">
            <Sparkles className="w-4 h-4 mr-2 inline animate-pulse" />
            {featuredBooks.length} New Titles Available
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Our New Book Releases
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm mb-5">
            Quick revision guides, medical imaging, and classical literature — now on Google Play Books
          </p>

          <Button
            onClick={() => setShowBooks((prev) => !prev)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white px-6 py-3 h-auto text-base font-semibold rounded-xl shadow-sm"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Latest Book Release
            {showBooks ? (
              <ChevronUp className="w-5 h-5 ml-2" />
            ) : (
              <ChevronDown className="w-5 h-5 ml-2" />
            )}
          </Button>
        </div>

        {showBooks && (
          <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Price</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-right">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {featuredBooks.map((book, i) => (
                    <tr
                      key={book.id}
                      className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                        i % 2 === 1 ? "bg-slate-50/50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-slate-900 leading-snug">{book.title}</div>
                        <div className="text-xs text-blue-600 font-medium mt-0.5">{book.category}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-slate-600 leading-relaxed max-w-md">
                        {book.description}
                      </td>
                      <td className="px-4 py-3 align-top font-bold text-green-600 whitespace-nowrap">
                        {book.price}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <a
                          href={book.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#1565C0] hover:text-[#0d47a1] font-semibold whitespace-nowrap"
                        >
                          View
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked list */}
            <div className="md:hidden divide-y divide-slate-100">
              {featuredBooks.map((book) => (
                <div key={book.id} className="p-4">
                  <div className="font-semibold text-slate-900 leading-snug mb-0.5">{book.title}</div>
                  <div className="text-xs text-blue-600 font-medium mb-1.5">{book.category}</div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">{book.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-green-600">{book.price}</span>
                    <a
                      href={book.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1565C0] font-semibold text-sm"
                    >
                      View <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                📚 Available on Google Play Books • Instant access on all devices • Free sample chapters available
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
