
import React, { useState, useEffect } from 'react';
import { Course } from '@/entities/Course';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, UserPlus } from "lucide-react"; // Added UserPlus
import EnrollStudentModal from '../components/admin/EnrollStudentModal'; // Added EnrollStudentModal import

const CourseStatusBadge = ({ status }) => {
  const statusStyles = {
    draft: "bg-yellow-100 text-yellow-800 border-yellow-300",
    published: "bg-green-100 text-green-800 border-green-300",
    archived: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return <Badge className={`${statusStyles[status]} capitalize`}>{status}</Badge>;
};

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false); // New state for modal

  const fetchAllCourses = async () => {
    setIsLoading(true);
    try {
      const allCourses = await Course.list("-created_date");
      setCourses(allCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const handlePublish = async (courseId) => {
    try {
      await Course.update(courseId, { status: 'published' });
      await fetchAllCourses(); // Refresh list
    } catch (error) {
      console.error("Failed to publish course:", error);
      alert("Error: Could not publish the course.");
    }
  };

  const handleEnrollmentSuccess = () => {
    setShowEnrollModal(false);
    fetchAllCourses(); // Refresh to show updated enrollment counts
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Course Management</h1>
        <Button onClick={() => setShowEnrollModal(true)} className="bg-purple-600 hover:bg-purple-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Enroll Student
        </Button>
      </div>
      
      {courses.length === 0 ? (
        <p>No courses have been created yet.</p>
      ) : (
        <div className="grid gap-6">
          {courses.map(course => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="mb-1">{course.title}</CardTitle>
                    <CardDescription>by {course.tutor_name || 'N/A'}</CardDescription>
                  </div>
                  <CourseStatusBadge status={course.status} />
                </div>
              </CardHeader>
              <CardContent className="flex justify-between items-end">
                 <div>
                  <p className="text-sm text-slate-600">{course.subject} • {course.grade_level}</p>
                  <p className="font-semibold text-lg">₹{course.price}</p>
                </div>
                {course.status === 'draft' && (
                  <Button onClick={() => handlePublish(course.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Publish Course
                  </Button>
                )}
                 {course.status === 'published' && (
                  <div className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Published</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showEnrollModal && (
        <EnrollStudentModal
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />
      )}
    </div>
  );
}
