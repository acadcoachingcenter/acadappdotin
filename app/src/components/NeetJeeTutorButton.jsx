// app/src/components/NeetJeeTutorButton.jsx
// Always visible: active (clickable) when the API says this user may use it - tutors and
// admins always, students only when enrolled in a NEET/JEE course - and dormant (greyed out,
// disabled) for everyone else, so all students can see the feature exists and what unlocks it.
// (The API enforces this again when it issues the tutor token, so this is a convenience, not the security.)
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
      .catch(() => { if (alive) setEligible(false); });     // any error -> dormant, never active
    return () => { alive = false; };
  }, []);

  if (eligible) {
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

  return (
    <button
      type="button"
      disabled
      title="Available once you're enrolled in a NEET or JEE course"
      className={
        'inline-flex cursor-not-allowed items-center gap-2 rounded-xl px-5 py-3 font-semibold ' +
        'bg-slate-200 text-slate-500 ' + className
      }
    >
      <span aria-hidden="true">🎓</span>
      NEET | JEE Smart-Tutor
      <span className="ml-1 rounded-full bg-slate-300 px-2 py-0.5 text-xs">
        NEET/JEE only
      </span>
    </button>
  );
}
