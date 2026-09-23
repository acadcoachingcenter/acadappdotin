import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ExternalLink } from "lucide-react";
import NeetJeeTutorButton from "@/components/NeetJeeTutorButton";

// Shared "Quick Access" button row - Smart Classroom / GradeMe / NEET-JEE
// Smart-Tutor - used identically on the Admin, Tutor, and Student
// dashboards. Any future feature only needs to be added here once to show
// up on all three at the same time, instead of being built separately per
// dashboard.
//
// smartClassroomEnabled / grademeEnabled: whether each button is active.
// - Admin/Tutor dashboards: pass `true` unconditionally - staff always have
//   access, the same principle NeetJeeTutorButton already applies to its
//   own eligibility check (tutors/admins always eligible, students gated).
// - Student dashboard: pass the result of that page's own
//   getFeatureAccess() check (an admin-set StudentFeatureAccess row if one
//   exists, falling back to whether the student has a confirmed
//   enrollment).
//
// NeetJeeTutorButton needs no props here - it already determines its own
// eligibility per-role via a server-side check, unchanged by this component.
export default function QuickAccessRow({ smartClassroomEnabled, grademeEnabled }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Quick Access
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {smartClassroomEnabled ? (
          <a
            href="https://smart-tutor.acadapp.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-amber-700"
          >
            Open Smart Classroom
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Available once your enrollment is confirmed"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-500"
          >
            Open Smart Classroom
            <ExternalLink className="w-4 h-4" />
          </button>
        )}

        {grademeEnabled ? (
          <Link
            to={createPageUrl("GradeMe")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1565C0] px-5 py-3 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-[#1e88e5]"
          >
            Start GradeMe
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="Available once your enrollment is confirmed"
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-500"
          >
            Start GradeMe
          </button>
        )}

        <NeetJeeTutorButton />
      </CardContent>
    </Card>
  );
}
