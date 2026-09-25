import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Course } from '@/entities/Course';
import { Assignment } from '@/entities/Assignment';
import { Enrollment } from '@/entities/Enrollment';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, PlusCircle, Users, UserPlus, ArrowRight } from "lucide-react";
import AddStudentModal from '../components/tutor/AddStudentModal';

export default function CourseDetails() {
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const courseId = new URLSearchParams(location.search).get('id');

  const loadCourseData = useCallback(async () => {
    if (!courseId) {
      console.error("No courseId found in URL");
      return;
    }

    setIsLoading(true);

    try {
      const courseData = await Course.get(courseId);
      setCourse(courseData);

      const assignmentData = await Assignment.filter({ course_id: courseId });
      setAssignments(assignmentData);

      const enrollmentData = await Enrollment.filter({ course_id: courseId, status: 'active' });
      setEnrollments(enrollmentData);

    } catch (error) {
      console.error("Failed to load course details:", error);
    }
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  if (isLoading) return <div>Loading...</div>;
  if (!course) return <div>Course not found.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{course.title}</CardTitle>
          <CardDescription>{course.subject} • {course.grade_level}</CardDescription>
          {/* Debug info */}
          <p className="text-xs text-slate-400">Course ID: {courseId}</p>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Study Materials -- moved to a chapter-scoped shared library
            (grade/subject/chapter, not tied to one course) rather than
            uploaded files here, to avoid R2/D1 storage costs and to keep
            materials shared across every tutor teaching that chapter. */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText /> Study Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Study materials now live in one shared place, organized by chapter instead of by course --
              any material you add there is visible to every student on that chapter, not just this course.
            </p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link to={createPageUrl("TutorStudyMaterials")}>
                Go to Study Materials
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Enrolled Students Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users/> Students ({enrollments.length})</CardTitle>
                <Button size="sm" onClick={() => setIsStudentModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2"/> Add Student
                </Button>
            </CardHeader>
            <CardContent>
                {enrollments.length > 0 ? (
                    <ul className="space-y-2">
                        {enrollments.map(enr => (
                            <li key={enr.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                <span>{enr.student_name}</span>
                                <span className="text-xs text-slate-500">{new Date(enr.enrollment_date).toLocaleDateString()}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 text-center py-4">No students enrolled yet.</p>
                )}
            </CardContent>
        </Card>

        {/* Assignments Card */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><BookOpen /> Assignments & Activities ({assignments.length})</CardTitle>
            <Button size="sm" asChild variant="secondary">
                <Link to="#">
                    <PlusCircle className="w-4 h-4 mr-2" /> Create Assignment
                </Link>
            </Button>
          </CardHeader>
          <CardContent>
             {assignments.length > 0 ? (
              <ul className="space-y-2">
                {assignments.map(ass => (
                  <li key={ass.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                    <span>{ass.title}</span>
                    <span className="text-sm text-slate-500">Due: {new Date(ass.due_date).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-center py-4">No assignments created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {isStudentModalOpen && (
        <AddStudentModal
            course={course}
            open={isStudentModalOpen}
            onOpenChange={setIsStudentModalOpen}
            onStudentAdded={loadCourseData}
        />
      )}
    </div>
  );
}
