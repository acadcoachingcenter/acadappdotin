import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Course } from "@/entities/Course";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  BookOpen,
  Plus,
  Users,
  Clock,
  IndianRupee,
  AlertCircle,
} from "lucide-react";

export default function MyCourses() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }

    if (!user) {
      navigate(createPageUrl("Welcome"));
      return;
    }

    if (user.user_type !== "tutor") {
      navigate(createPageUrl("Welcome"));
      return;
    }

    const fetchCourses = async () => {
      setIsLoading(true);
      setError("");

      try {
        const tutorCourses = await Course.filter({
          tutor_id: user.id,
        });

        setCourses(tutorCourses || []);
      } catch (error) {
        console.error("Error fetching courses:", error);

        setError(
          `Failed to load courses: ${
            error?.message || "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user, isLoadingAuth, navigate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        );

      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending Approval
          </Badge>
        );

      case "draft":
        return (
          <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">
            Draft
          </Badge>
        );

      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Rejected
          </Badge>
        );

      default:
        return (
          <Badge variant="secondary">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1565C0] mx-auto" />
        <p className="mt-4 text-slate-600">
          Loading your account...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <p className="text-slate-600">
          Redirecting...
        </p>
      </div>
    );
  }

  if (user.user_type !== "tutor") {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center">
        <p className="text-slate-600">
          Checking account permissions...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-[#1565C0]" />

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              My Courses
            </h1>

            <p className="text-slate-600 mt-1">
              Manage the courses you have created.
            </p>
          </div>
        </div>

        <Button
          onClick={() =>
            navigate(createPageUrl("CreateCourse"))
          }
          className="bg-[#1565C0] hover:bg-[#1e88e5]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Course
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1565C0] mx-auto" />
          <p className="mt-4 text-slate-600">
            Loading your courses...
          </p>
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-slate-400" />

            <h2 className="text-xl font-semibold text-slate-900 mt-4">
              No courses yet
            </h2>

            <p className="text-slate-600 mt-2">
              You haven't created any courses yet.
            </p>

            <Button
              onClick={() =>
                navigate(createPageUrl("CreateCourse"))
              }
              className="mt-6 bg-[#1565C0] hover:bg-[#1e88e5]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-xl leading-tight">
                    {course.title}
                  </CardTitle>

                  {getStatusBadge(course.status)}
                </div>

                <p className="text-sm text-slate-500">
                  {course.subject}
                  {course.grade_level
                    ? ` • ${course.grade_level}`
                    : ""}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 line-clamp-3">
                  {course.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <IndianRupee className="w-4 h-4" />
                    <span>
                      {course.price || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {course.duration_weeks || 0} weeks
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>
                      {course.enrolled_students || 0} /{" "}
                      {course.max_students || 0} students
                    </span>
                  </div>
                </div>

                {course.status === "rejected" &&
                  course.rejection_reason && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <p className="text-sm font-medium text-red-800">
                        Rejection reason
                      </p>

                      <p className="text-sm text-red-700 mt-1">
                        {course.rejection_reason}
                      </p>
                    </div>
                  )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}