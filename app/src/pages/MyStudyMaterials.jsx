import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";

// Study materials moved to a shared, chapter-scoped library (grade/subject/
// chapter, not tied to a course_id) - see StudentStudyMaterials.jsx. This
// page's old course_id-based filtering can never match anything under that
// system, so it's replaced with a pointer rather than left to silently
// show "no materials" forever.
export default function MyStudyMaterials() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Study Materials</h1>
        <p className="text-slate-600 mt-2">
          Study materials now live in one shared place, organized by chapter.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            Study Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Pick a subject and chapter to see everything your tutors have shared for it.
          </p>
          <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            <Link to={createPageUrl("StudentStudyMaterials")}>
              Go to Study Materials
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
