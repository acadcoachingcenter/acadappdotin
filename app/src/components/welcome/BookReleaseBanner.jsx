import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";

export default function BookReleaseBanner() {
  const featuredBooks = [
    {
      id: 1,
      title: "PHYSICS XII CBSE QUICK REVISION GUIDE",
      description: "Fast, confident revision for Boards, JEE, and NEET with key concepts, formulas, and exam-ready theory.",
      category: "CBSE Class 12 Physics",
      releaseDate: "Feb 2026",
      color: "from-blue-600 to-indigo-700",
      badgeColor: "bg-blue-500",
      link: "https://play.google.com/store/books/details?id=FZe-EQAAQBAJ",
      price: "₹149"
    },
    {
      id: 2,
      title: "Grade 10 CBSE Science - Quick Revision Guide",
      description: "Complete Physics, Chemistry, and Biology revision with NCERT-aligned content, exam tips, and key formulas.",
      category: "CBSE Class 10 Science",
      releaseDate: "Jan 2026",
      color: "from-green-600 to-teal-700",
      badgeColor: "bg-green-500",
      link: "https://play.google.com/store/books/details?id=wc-xEQAAQBAJ",
      price: "₹99"
    },
    {
      id: 3,
      title: "MRI – Optimizing Pulse Sequences for Advanced Imaging Protocols",
      description: "Bridge the gap between MRI physics and protocol optimization for radiologists, technologists, and researchers.",
      category: "Medical Imaging",
      releaseDate: "Jan 2026",
      color: "from-purple-600 to-pink-700",
      badgeColor: "bg-purple-500",
      link: "https://play.google.com/store/books/details?id=KZuuEQAAQBAJ",
      price: "₹999"
    },
    {
      id: 4,
      title: "திருக்குறளில் எண்ணும் நெறியும்",
      description: "A numerical journey through Thirukkural - exploring mathematical philosophy in Thiruvalluvar's ethics.",
      category: "Tamil Literature",
      releaseDate: "Jan 2026",
      color: "from-orange-600 to-red-700",
      badgeColor: "bg-orange-500",
      link: "https://play.google.com/store/books/details?id=6s-2EQAAQBAJ",
      price: "₹99"
    },
    {
      id: 5,
      title: "Electronic Sensors in Medical Application",
      description: "Fundamentals to clinical use, data integration, and future trends in medical sensor technology.",
      category: "Medical Technology",
      releaseDate: "Jan 2026",
      color: "from-cyan-600 to-blue-700",
      badgeColor: "bg-cyan-500",
      link: "https://play.google.com/store/books/details?id=p6y7EQAAQBAJ",
      price: "₹599"
    },
    {
      id: 6,
      title: "NEET Biology Class XI - Complete Revision Guide",
      description: "Exam-oriented study companion covering all 19 chapters of Class XI Biology with a proven 9-section format for each chapter.",
      category: "NEET / Class XI Biology",
      releaseDate: "Mar 2026",
      color: "from-green-600 to-emerald-700",
      badgeColor: "bg-green-500",
      link: "https://play.google.com/store/books/details?id=-B7JEQAAQBAJ",
      price: "₹69"
    },
    {
      id: 7,
      title: "NEET Physics Class XI - Complete Revision Guide",
      description: "Derivation-focused, formula-dense guide covering all 15 chapters of Class XI Physics tailored for JEE Main, JEE Advanced, and NEET-UG.",
      category: "NEET / Class XI Physics",
      releaseDate: "Feb 2026",
      color: "from-blue-600 to-indigo-700",
      badgeColor: "bg-blue-500",
      link: "https://play.google.com/store/books/details?id=CCrJEQAAQBAJ",
      price: "₹49"
    },
    {
      id: 8,
      title: "NEET JEE Vetri Paathai (Tamil)",
      description: "A practical Tamil guide for NEET and JEE aspirants covering application procedures, eligibility, fee structure, exam pattern, and preparation strategies.",
      category: "NEET / JEE (Tamil)",
      releaseDate: "Feb 2026",
      color: "from-amber-600 to-orange-700",
      badgeColor: "bg-amber-500",
      link: "https://play.google.com/store/books/details?id=vVLHEQAAQBAJ",
      price: "₹39"
    },
    {
      id: 9,
      title: "Chemistry XII Quick Revision Guide - Volume 1",
      description: "Comprehensive handbook for Class XII students covering Electrochemistry, Kinetics, Coordination Compounds, Organic Chemistry, and Surface Chemistry.",
      category: "CBSE Class 12 Chemistry",
      releaseDate: "Feb 2026",
      color: "from-rose-600 to-pink-700",
      badgeColor: "bg-rose-500",
      link: "https://play.google.com/store/books/details?id=ia_BEQAAQBAJ",
      price: "₹97"
    },
    {
      id: 10,
      title: "Chemistry XII Quick Revision Guide - Volume 2",
      description: "Focused revision companion for Organic Chemistry: Haloalkanes, Alcohols, Aldehydes, Ketones, Amines, and Biomolecules with exam-style questions and memory aids.",
      category: "CBSE Class 12 Chemistry",
      releaseDate: "Feb 2026",
      color: "from-rose-600 to-red-700",
      badgeColor: "bg-rose-500",
      link: "https://play.google.com/store/books/details?id=lfvBEQAAQBAJ",
      price: "₹89"
    },
    {
      id: 11,
      title: "Biology XII CBSE Quick Revision Guide",
      description: "Exam-oriented guide transforming the entire Class XII Biology syllabus into high-scoring content with all 13 chapters, memory aids, and concept maps.",
      category: "CBSE Class 12 Biology",
      releaseDate: "Feb 2026",
      color: "from-emerald-600 to-green-700",
      badgeColor: "bg-emerald-500",
      link: "https://play.google.com/store/books/details?id=DBHBEQAAQBAJ",
      price: "₹129"
    },
    {
      id: 12,
      title: "Physics Class Notes Grade XI CBSE Vol-1",
      description: "Concise, exam-focused revision companion as per latest CBSE syllabus with crisp theory, essential definitions, key formulas, and important derivations.",
      category: "CBSE Class 11 Physics",
      releaseDate: "Feb 2026",
      color: "from-blue-600 to-cyan-700",
      badgeColor: "bg-blue-500",
      link: "https://play.google.com/store/books/details?id=sNjjEQAAQBAJ",
      price: "₹29"
    },
    {
      id: 13,
      title: "Physics Class Notes Grade XI CBSE Vol-2",
      description: "Continuation of structured Class XI Physics notes with simplified explanations, formula sheets, and concept-based insights for JEE and NEET.",
      category: "CBSE Class 11 Physics",
      releaseDate: "Feb 2026",
      color: "from-blue-600 to-sky-700",
      badgeColor: "bg-blue-500",
      link: "https://play.google.com/store/books/details?id=H-jjEQAAQBAJ",
      price: "₹29"
    },
    {
      id: 14,
      title: "Chemistry Class Notes - Grade XI CBSE",
      description: "Chapter-wise class notes for Class XI Chemistry with simplified explanations, key formulas, reactions, comparison tables, and quick revision points.",
      category: "CBSE Class 11 Chemistry",
      releaseDate: "Feb 2026",
      color: "from-violet-600 to-purple-700",
      badgeColor: "bg-violet-500",
      link: "https://play.google.com/store/books/details?id=7E3GEQAAQBAJ",
      price: "₹75"
    },
    {
      id: 15,
      title: "Mathematics Class Notes - Grade X CBSE",
      description: "Structured exam companion for CBSE Class X Mathematics with chapter-wise notes, theorems, identities, and step-by-step concept explanations.",
      category: "CBSE Class 10 Mathematics",
      releaseDate: "Feb 2026",
      color: "from-indigo-600 to-blue-700",
      badgeColor: "bg-indigo-500",
      link: "https://play.google.com/store/books/details?id=LaHFEQAAQBAJ",
      price: "₹49"
    },
    {
      id: 16,
      title: "Mathematics Class Notes - Grade XI CBSE Volume I",
      description: "Structured companion for Class XI Mathematics covering algebra, trigonometry, complex numbers, inequalities, and coordinate geometry with derivations.",
      category: "CBSE Class 11 Mathematics",
      releaseDate: "Feb 2026",
      color: "from-slate-600 to-slate-800",
      badgeColor: "bg-slate-500",
      link: "https://play.google.com/store/books/details?id=v7HFEQAAQBAJ",
      price: "₹45"
    },
    {
      id: 17,
      title: "Mathematics Class Notes - Grade XI CBSE Volume II",
      description: "Continuation covering advanced algebra, statistics, probability, straight lines, conic sections, and limits with comparison tables and revision points.",
      category: "CBSE Class 11 Mathematics",
      releaseDate: "Feb 2026",
      color: "from-slate-600 to-gray-800",
      badgeColor: "bg-slate-500",
      link: "https://play.google.com/store/books/details?id=muzFEQAAQBAJ",
      price: "₹45"
    },
    {
      id: 18,
      title: "Biology Class Notes Volume I - Grade XI CBSE",
      description: "Concise exam-oriented study guide for Class XI Biology covering diversity of living organisms, plant and animal structures, and biological principles.",
      category: "CBSE Class 11 Biology",
      releaseDate: "Feb 2026",
      color: "from-teal-600 to-emerald-700",
      badgeColor: "bg-teal-500",
      link: "https://play.google.com/store/books/details?id=XdHGEQAAQBAJ",
      price: "₹48"
    },
    {
      id: 19,
      title: "Biology Class Notes Volume II - Grade XI CBSE",
      description: "Focuses on fundamental biological processes governing living organisms with structured notes, key definitions, diagrams, and essential terms.",
      category: "CBSE Class 11 Biology",
      releaseDate: "Feb 2026",
      color: "from-teal-600 to-green-700",
      badgeColor: "bg-teal-500",
      link: "https://play.google.com/store/books/details?id=SEvHEQAAQBAJ",
      price: "₹48"
    },
    {
      id: 20,
      title: "Medical Imaging Science Vol 1",
      description: "Foundations of light, radiation, and medical imaging - optics, laser physics, radiation physics, and X-ray based imaging for biomedical sciences.",
      category: "Medical Imaging",
      releaseDate: "Feb 2026",
      color: "from-purple-600 to-indigo-700",
      badgeColor: "bg-purple-500",
      link: "https://play.google.com/store/books/details?id=YkbFEQAAQBAJ",
      price: "₹95"
    },
    {
      id: 21,
      title: "Medical Imaging Science - Volume 2",
      description: "Advanced imaging, bioelectrical signals, and laboratory techniques - MRI, ultrasound, nuclear medicine, ECG/EEG/EMG, and practical measurement physics.",
      category: "Medical Imaging",
      releaseDate: "Feb 2026",
      color: "from-fuchsia-600 to-purple-700",
      badgeColor: "bg-fuchsia-500",
      link: "https://play.google.com/store/books/details?id=603FEQaAQBAJ",
      price: "₹85"
    },
    {
      id: 22,
      title: "A Bicycle and a Life (Tamil)",
      description: "A reflective Tamil literary work exploring life's journey, choices, and meaning through an introspective narrative.",
      category: "Tamil Literature",
      releaseDate: "Feb 2026",
      color: "from-orange-600 to-amber-700",
      badgeColor: "bg-orange-500",
      link: "https://play.google.com/store/books/details?id=ChTAEQAAQBAJ",
      price: "₹49"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-base font-bold border-0 mb-4">
            <Sparkles className="w-5 h-5 mr-2 inline animate-pulse" />
            Latest Book Releases - January 2026
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Our New Book Releases
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Educational resources now available on Google Play Books - Quick revision guides, medical imaging, and classical literature
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {featuredBooks.map((book) => (
            <Card 
              key={book.id} 
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-slate-200 hover:border-blue-300 group"
            >
              <div className={`h-2 bg-gradient-to-r ${book.color}`}></div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Badge className={`${book.badgeColor} text-white px-2 py-1 text-xs font-bold border-0 mb-3`}>
                    {book.releaseDate}
                  </Badge>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-xs text-blue-600 font-semibold mb-2">
                    {book.category}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 mb-3">
                    {book.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-lg font-bold text-green-600">{book.price}</span>
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      eBook
                    </Badge>
                  </div>
                </div>
                <Button 
                  asChild
                  className={`w-full bg-gradient-to-r ${book.color} hover:opacity-90 text-white`}
                >
                  <a href={book.link} target="_blank" rel="noopener noreferrer">
                    View on Google Play Books
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 text-sm">
            📚 Available on Google Play Books • Instant access on all devices • Free sample chapters available
          </p>
        </div>
      </div>
    </section>
  );
}