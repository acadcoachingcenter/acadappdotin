import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CheckCircle2, ClipboardList, Loader2 } from "lucide-react";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TopicLog() {
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [courseId, setCourseId] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [classDate, setClassDate] = useState(todayStr());
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [recentLogs, setRecentLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingOptions(true);
    Promise.all([
      apiClient.entities.Course.filter({ tutor_id: user.id }).catch(() => []),
      apiClient.grademe.availableChapters().catch(() => []),
    ])
      .then(([courseRows, chapterRows]) => {
        setCourses(Array.isArray(courseRows) ? courseRows : []);
        setAvailableChapters(Array.isArray(chapterRows) ? chapterRows : []);
      })
      .finally(() => setLoadingOptions(false));
  }, [user]);

  const subjects = [];
  const seenSubjects = new Set();
  for (const c of availableChapters) {
    if (!seenSubjects.has(c.subjectId)) {
      seenSubjects.add(c.subjectId);
      subjects.push(c);
    }
  }
  const chaptersForSubject = availableChapters.filter((c) => c.subjectId === subject);

  const loadRecentLogs = useCallback((forCourseId) => {
    if (!forCourseId) {
      setRecentLogs([]);
      return;
    }
    setIsLoadingLogs(true);
    apiClient.entities.TopicLog
      .filter({ course_id: forCourseId }, "-class_date", 15)
      .then((rows) => setRecentLogs(Array.isArray(rows) ? rows : []))
      .catch((err) => {
        console.error("Unable to load recent topic logs:", err);
        setRecentLogs([]);
      })
      .finally(() => setIsLoadingLogs(false));
  }, []);

  useEffect(() => {
    loadRecentLogs(courseId);
  }, [courseId, loadRecentLogs]);

  async function handleSubmit() {
    if (!courseId || !subject || !chapter) {
      setSaveError("Pick a course, subject, and chapter first.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const chapterObj = chaptersForSubject.find((c) => c.chapterId === chapter);

    try {
      await apiClient.entities.TopicLog.create({
        course_id: courseId,
        tutor_id: user.id,
        subject,
        chapter,
        chapter_title: chapterObj?.chapterTitle || chapter,
        class_date: classDate,
        notes,
      });
      setSaveSuccess(true);
      setNotes("");
      loadRecentLogs(courseId);
    } catch (err) {
      console.error("Unable to save topic log:", err);
      setSaveError(err.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Log Topics Covered</h1>
        <p className="text-slate-600 mt-1">
          A quick note after each class — what did you teach? This is what the weekly test
          generator uses to target recently-covered material instead of random chapters.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-5 h-5 text-[#1565C0]" />
            New Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingOptions ? "Loading…" : "Select one of your courses"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loadingOptions && courses.length === 0 && (
              <p className="text-xs text-slate-500">No courses found under your account.</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={(v) => { setSubject(v); setChapter(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.subjectId} value={s.subjectId}>
                      {s.className ? `${s.className} — ${s.subjectName}` : s.subjectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select value={chapter} onValueChange={setChapter} disabled={!subject}>
                <SelectTrigger>
                  <SelectValue placeholder={subject ? "Select a chapter" : "Pick a subject first"} />
                </SelectTrigger>
                <SelectContent>
                  {chaptersForSubject.map((c) => (
                    <SelectItem key={c.chapterId} value={c.chapterId}>
                      {c.chapterTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Class date</Label>
            <input
              type="date"
              value={classDate}
              max={todayStr()}
              onChange={(e) => setClassDate(e.target.value)}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. covered up to Newton's third law, skipped the numericals"
              rows={2}
            />
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {saveError}
            </p>
          )}
          {saveSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Logged.
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSaving || !courseId || !subject || !chapter}
            className="bg-[#1565C0] hover:bg-[#1e88e5]"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Log This Topic
          </Button>
        </CardContent>
      </Card>

      {courseId && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            Recent entries{selectedCourse ? ` — ${selectedCourse.title}` : ""}
          </h2>
          {isLoadingLogs ? (
            <div className="flex items-center gap-2 py-6 justify-center text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="text-sm text-slate-500">No entries logged for this course yet.</p>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5"
                >
                  <div>
                    <span className="font-medium text-slate-900 text-sm">{log.chapter_title}</span>
                    {log.notes && <p className="text-xs text-slate-500 mt-0.5">{log.notes}</p>}
                  </div>
                  <Badge variant="outline">{log.class_date}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
