// app/src/components/NeetJeeTutorButton.jsx
// Shows "NEET | JEE Smart-Tutor" only when the API says this user may use it:
// tutors and admins always, students only when enrolled in the NEET | JEE course.
// (The API enforces this again when it issues the tutor token, so hiding the button is just tidiness.)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// ADJUST if your alias/path differs: this is the client from apiClient.js
import { apiClient } from '@/api/apiClient';

export default function NeetJeeTutorButton({ className = '' }) {
  const navigate = useNavigate();
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    let alive = true;
    apiClient.functions.invoke('tutorAccess', {})
      .then((r) => { if (alive) setEligible(!!(r && r.eligible)); })
      .catch(() => { if (alive) setEligible(false); });     // any error -> no button
    return () => { alive = false; };
  }, []);

  if (!eligible) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/NeetJeeTutor')}
      className={
        'inline-flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-white shadow-lg ' +
        'bg-gradient-to-r from-violet-600 to-teal-500 hover:from-violet-500 hover:to-teal-400 ' +
        'transition-transform hover:-translate-y-0.5 ' + className
      }
    >
      <span aria-hidden="true">🎓</span>
      NEET | JEE Smart-Tutor
      <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">AI</span>
    </button>
  );
}
