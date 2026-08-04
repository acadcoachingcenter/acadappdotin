import { useEffect } from "react";

export default function AcademicEssentials() {
  useEffect(() => {
    // Redirect to external site
    window.location.href = "https://acad-formulabox.netlify.app/";
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecting to Academic Essentials...</p>
      </div>
    </div>
  );
}