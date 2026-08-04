import React, { useState, useEffect } from "react";
import { X, Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TestimonialPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      name: "Sri Hari",
      role: "Student - 10th Grade",
      image: "https://ui-avatars.com/api/?name=Sri+Hari&background=1565C0&color=fff&size=128",
      rating: 5,
      text: "ACAD helped me improve my Math score from 65% to 92% in just 6 months! The tutors are very patient and explain concepts clearly. Best decision ever!",
      type: "student"
    },
    {
      name: "Bhavya Priya",
      role: "Student - 10th Grade",
      image: "https://ui-avatars.com/api/?name=Bhavya+Priya&background=ea580c&color=fff&size=128",
      rating: 5,
      text: "The live classes are amazing! I can ask questions anytime and the tutors make even difficult topics easy to understand. My grades have improved so much!",
      type: "student"
    },
    {
      name: "Abhinav",
      role: "Student - 12th Grade",
      image: "https://ui-avatars.com/api/?name=Abhinav&background=16a34a&color=fff&size=128",
      rating: 5,
      text: "ACAD's focused coaching helped me understand Physics and Chemistry concepts better. The doubt clearing sessions are incredibly helpful for exam preparation!",
      type: "student"
    },
    {
      name: "Anya",
      role: "Student - 11th Grade",
      image: "https://ui-avatars.com/api/?name=Anya&background=9333ea&color=fff&size=128",
      rating: 5,
      text: "I love the interactive whiteboard sessions! The study materials are well organized and the tutors are always available to help. Highly recommend ACAD!",
      type: "student"
    }
  ];

  useEffect(() => {
    const hasSeenTestimonials = sessionStorage.getItem('hasSeenTestimonials');
    
    if (!hasSeenTestimonials) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-close after 15 seconds
  useEffect(() => {
    if (isVisible) {
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 15000);
      
      return () => clearTimeout(autoCloseTimer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('hasSeenTestimonials', 'true');
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'student':
        return 'from-blue-500 to-cyan-500';
      case 'parent':
        return 'from-green-500 to-emerald-500';
      case 'tutor':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-slate-500 to-gray-500';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'student':
        return { emoji: '🎓', label: 'Student Review' };
      case 'parent':
        return { emoji: '👨‍👩‍👧', label: 'Parent Review' };
      case 'tutor':
        return { emoji: '👨‍🏫', label: 'Tutor Review' };
      default:
        return { emoji: '⭐', label: 'Review' };
    }
  };

  if (!isVisible) return null;

  const current = testimonials[currentIndex];
  const typeBadge = getTypeBadge(current.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md sm:max-w-lg w-full p-4 sm:p-6 animate-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
          aria-label="Close testimonials"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r ${getTypeColor(current.type)} text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base`}>
            <span className="text-base sm:text-xl">{typeBadge.emoji}</span>
            <span>{typeBadge.label}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">
            What Our Community Says
          </h2>
          <p className="text-sm sm:text-base text-slate-600">Real reviews from students</p>
        </div>

        {/* Testimonial Card */}
        <div className="relative bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <Quote className="absolute top-2 left-2 sm:top-4 sm:left-4 w-8 h-8 sm:w-10 sm:h-10 text-blue-200" />
          
          <div className="flex flex-col items-center text-center relative z-10">
            <img
              src={current.image}
              alt={current.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 border-white shadow-lg mb-3 sm:mb-4"
            />
            
            <div className="flex gap-1 mb-2 sm:mb-3">
              {[...Array(current.rating)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-3 sm:mb-4 italic">
              "{current.text}"
            </p>

            <div>
              <h4 className="font-bold text-slate-900 text-base sm:text-lg">{current.name}</h4>
              <p className="text-xs sm:text-sm text-slate-600">{current.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button
            onClick={handlePrev}
            variant="outline"
            size="sm"
            className="gap-1 text-xs sm:text-sm px-2 sm:px-3"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex gap-1.5 sm:gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-[#1565C0] w-4 sm:w-6' : 'bg-slate-300'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            variant="outline"
            size="sm"
            className="gap-1 text-xs sm:text-sm px-2 sm:px-3"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 sm:pt-6 border-t border-slate-200">
          <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">
            Join thousands on ACAD
          </p>
          <Button
            onClick={handleClose}
            className="bg-[#1565C0] hover:bg-[#1e88e5] text-sm sm:text-base px-4 sm:px-6"
            size="sm"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}