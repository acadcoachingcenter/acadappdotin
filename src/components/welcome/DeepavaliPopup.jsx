import React, { useState, useEffect } from "react";
import { X, Gift, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NewYearPongalPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already closed the popup in this session
    const hasClosedPopup = sessionStorage.getItem('newYearPongalPopupClosed');
    
    if (!hasClosedPopup) {
      // Show popup after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('newYearPongalPopupClosed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative bg-gradient-to-br from-orange-50 via-yellow-50 to-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-300 border-4 border-orange-500">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
          aria-label="Close popup"
        >
          <X className="w-5 h-5 text-orange-600" />
        </button>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500"></div>
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full p-3 shadow-lg border-4 border-orange-500">
            <Gift className="w-8 h-8 text-orange-600 animate-bounce" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-600 animate-pulse" />
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
              🎊 Happy New Year 2026! 🎉
            </h2>
            <Sparkles className="w-6 h-6 text-orange-600 animate-pulse" />
          </div>

          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            🌾 பொங்கல் Pongal Celebration! 🪔
          </h3>

          <div className="bg-gradient-to-r from-orange-500 to-yellow-600 text-white rounded-xl p-6 mb-6 shadow-lg">
            <p className="text-4xl font-bold mb-2">🎁 20% OFF</p>
            <p className="text-lg font-semibold">
              New Year & Pongal Special Offer on All Courses!
            </p>
          </div>

          <p className="text-slate-700 mb-6 leading-relaxed">
            🎉 Ring in the New Year and celebrate Pongal with quality education! 
            <br />
            <span className="font-semibold text-orange-600">
              Limited time offer - Enroll now and save big!
            </span>
          </p>

          <div className="space-y-3">
            <Link to={createPageUrl("FestiveSeasonOffer")}>
              <button
                onClick={handleClose}
                className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                🎊 Claim Your Festive Offer Now!
              </button>
            </Link>

            <button
              onClick={handleClose}
              className="w-full text-slate-600 hover:text-slate-800 font-medium py-2 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-4">
            🌾 Offer valid through Pongal 2026 • Limited seats available
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-4 text-4xl animate-bounce">🌾</div>
        <div className="absolute top-20 right-6 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>🪔</div>
        <div className="absolute bottom-10 left-8 text-3xl animate-bounce" style={{ animationDelay: '1s' }}>🎁</div>
        <div className="absolute bottom-14 right-4 text-4xl animate-bounce" style={{ animationDelay: '1.5s' }}>☀️</div>
      </div>
    </div>
  );
}