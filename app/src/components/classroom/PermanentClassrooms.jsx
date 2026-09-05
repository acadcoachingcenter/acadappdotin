import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ExternalLink, Loader2 } from "lucide-react";

/*
 * Permanent, subject-wise Google Meet links.
 *
 * These are the manual fallback classrooms tutors/students should use if the
 * Calendar -> WhatsApp automatic notification for a specific class ever
 * fails to deliver the right link in time. One link per subject, shared
 * across grades 6-12 given the current student volume, managed by the
 * admin under Admin > Classroom Links.
 */
export default function PermanentClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await apiClient.entities.SubjectClassroom.list("display_order");
        if (!isMounted) return;

        const active = (data || []).filter((room) => room.is_active !== false);
        setClassrooms(active);
      } catch (error) {
        console.error("Unable to load permanent classroom links:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return null; // Don't block the rest of the dashboard while this loads.
  }

  if (classrooms.length === 0) {
    return null; // Admin hasn't set any links up yet.
  }

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="w-5 h-5 text-[#1565C0]" />
          Permanent Classroom Links
        </CardTitle>
        <p className="text-sm text-slate-600">
          If a class's Meet link doesn't reach you automatically, join your subject's
          permanent classroom below (Class 6–12).
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classrooms.map((room) => (
            <a
              key={room.id}
              href={room.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 border border-slate-200 rounded-lg p-3 hover:border-[#1565C0] hover:bg-blue-50 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900">{room.subject}</p>
                {room.grade_range && (
                  <p className="text-xs text-slate-500">{room.grade_range}</p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-[#1565C0] flex-shrink-0" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
