import React, { useState, useEffect } from 'react';
import { Course } from '@/entities/Course';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle, Trash2, Settings } from "lucide-react"; // Added Settings
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CourseStatusBadge = ({ status }) => {
  const statusStyles = {
    draft: "bg-yellow-100 text-yellow-800 border-yellow-300",
    published: "bg-green-100 text-green-800 border-green-300",
    archived: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return <Badge className={`${statusStyles[status]} capitalize`}>{status}</Badge>;
};

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const user = await User.me();
        const tutorCourses = await Course.filter({ tutor_id: user.id });
        setCourses(tutorCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
        navigate(createPageUrl('Welcome'));
      }
      setIsLoading(false);
    };
    fetchCourses();
  }, [navigate]);

  const handleDelete = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    setDeletingId(course.id);
    try {
      await Course.delete(course.id);
      setCourses(prev => prev.filter(c => c.id !== course.id));
    } catch (error) {
      console.error("Error deleting course:", error);
      alert(`Failed to delete course: ${error.message || "Unknown error"}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
        <Button asChild>
          <Link to={createPageUrl("CreateCourse")}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Course
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <BookOpen className="mx-auto w-12 h-12 text-slate-400" />
            <CardTitle className="mt-4">You haven't created any courses yet.</CardTitle>
            <CardDescription>Click the button above to create your first course and start teaching.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6">
          {courses.map(course => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-1">{course.title}</CardTitle>
                    <CardDescription>{course.subject} • {course.grade_level}</CardDescription>
                  </div>
                  <CourseStatusBadge status={course.status} />
                </div>
              </CardHeader>
              <CardContent className="flex justify-between items-end">
                <div>
                  <p className="font-semibold text-lg">₹{course.price}</p>
                  <p className="text-sm text-slate-600">{course.enrolled_students || 0} students enrolled</p>
                </div>
                <div className="flex gap-2">
                   <Button asChild variant="outline" size="sm">
                    <Link to={createPageUrl(`CourseDetails?id=${course.id}`)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                  <Button variant="destructive" size="sm" disabled={course.status === 'published' || deletingId === course.id} onClick={() => handleDelete(course)}>
                    {deletingId === course.id ? "Deleting..." : (<><Trash2 className="w-4 h-4 mr-2" />Delete</>)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}