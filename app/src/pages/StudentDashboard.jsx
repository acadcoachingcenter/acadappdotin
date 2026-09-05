import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Course } from "@/entities/Course";
import { Enrollment } from "@/entities/Enrollment";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  User as UserIcon,
  ChevronUp,
  PlayCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import EnrollmentRequestModal from "../components/student/EnrollmentRequestModal";
import PermanentClassrooms from "@/components/classroom/PermanentClassrooms";

export default function StudentDashboard() {
  const { user, isLoadingAuth } = useAuth();

  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const loadData = useCallback(async () => {
    if (isLoadingAuth) {
      return;
    }

    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Load all courses
      const allCourses = await Course.list();

      // Only show published courses in the available-courses section
      const publishedCourses = (allCourses || []).filter(
        (course) => course.status === "published"
      );

      setCourses(publishedCourses);

      // Load this student's enrollment records
      const studentEnrollments = await Enrollment.filter({
        student_id: user.id,
      });

      setEnrollments(studentEnrollments || []);
    } catch (error) {
      console.error("Error loading student dashboard data:", error);
      setCourses([]);
      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoadingAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEnrollRequest = (course) => {
    setSelectedCourse(course);
  };

  const handleEnrollmentSuccess = () => {
    setSelectedCourse(null);

    alert(
      "Enrollment request submitted successfully! The admin will review it shortly."
    );

    loadData();
  };

  const getSubjectColor = (subject) => {
    const colors = {
      Mathematics: "bg-blue-100 text-blue-800",
      Physics: "bg-green-100 text-green-800",
      Chemistry: "bg-purple-100 text-purple-800",
      Biology: "bg-red-100 text-red-800",
      English: "bg-yellow-100 text-yellow-800",
      Hindi: "bg-orange-100 text-orange-800",
      "Social Science": "bg-indigo-100 text-indigo-800",
      "Computer Science": "bg-cyan-100 text-cyan-800",
    };

    return colors[subject] || "bg-gray-100 text-gray-800";
  };

  const getEnrollmentStatus = (enrollment) => {
    const status = String(enrollment?.status || "").toLowerCase();

    if (status === "active" || status === "approved") {
      return {
        label: "Enrolled",
        className:
          "bg-green-100 text-green-800 border-green-300",
      };
    }

    if (status === "pending") {
      return {
        label: "Pending Approval",
        className:
          "bg-yellow-100 text-yellow-800 border-yellow-300",
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejected",
        className:
          "bg-red-100 text-red-800 border-red-300",
      };
    }

    return {
      label: enrollment?.status || "Requested",
      className:
        "bg-slate-100 text-slate-800 border-slate-300",
    };
  };

  const getEnrollmentCourse = (enrollment) => {
    return courses.find(
      (course) => course.id === enrollment.course_id
    );
  };

  const enrolledCourses = enrollments
    .map((enrollment) => ({
      enrollment,
      course: getEnrollmentCourse(enrollment),
    }))
    .filter((item) => item.course);

  const renderPrice = (course) => {
    const now = new Date();

    const offerEndDate = course.offer_end_date
      ? new Date(course.offer_end_date)
      : null;

    const isOfferActive =
      course.original_price &&
      offerEndDate &&
      now < offerEndDate;

    if (isOfferActive) {
      return (
        <div className="text-right">
          <del className="text-sm text-slate-500">
            ₹{course.original_price}
          </del>

          <div className="text-lg font-bold text-red-600">
            ₹{course.price}
          </div>

          <p className="text-xs text-red-500">
            Offer available
          </p>
        </div>
      );
    }

    return (
      <div className="text-right">
        <div className="text-lg font-bold text-green-600">
          ₹{course.price}
        </div>
      </div>
    );
  };

  const isAlreadyRequested = (courseId) => {
    return enrollments.some(
      (enrollment) => enrollment.course_id === courseId
    );
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded animate-pulse" />

        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-200 rounded-lg animate-pulse"
            />
          ))}
        </div>

        <div className="h-48 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-slate-600">
            Unable to load your account. Please sign in again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const coursesToShow = showAllCourses
    ? courses
    : courses.slice(0, 6);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome, {user.full_name || "Student"}!
      </h1>

      {/* EMERGENCY / TUTOR-ABSENT FALLBACK */}
      <Card className="border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">
                Tutor unavailable, or class link not working?
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                Don't wait — jump into ACAD's Smart Classroom and keep learning right away.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="bg-amber-600 hover:bg-amber-700 whitespace-nowrap"
          >
            <a
              href="https://smart-tutor.acadapp.in/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Smart Classroom
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>

      <PermanentClassrooms />

      {/* Dashboard statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Courses
            </CardTitle>
            <BookOpen className="h-5 w-5 text-blue-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {courses.length}
            </div>

            <p className="text-xs text-slate-600 mt-1">
              Ready for enrollment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              My Enrollments
            </CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {enrolledCourses.length}
            </div>

            <p className="text-xs text-slate-600 mt-1">
              Courses requested/enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progress
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              0%
            </div>

            <p className="text-xs text-slate-600 mt-1">
              Overall progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Classes Today
            </CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              0
            </div>

            <p className="text-xs text-slate-600 mt-1">
              No classes scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* My Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Enrolled Courses</CardTitle>

          <p className="text-sm text-slate-600">
            Courses you have requested or are currently enrolled in.
          </p>
        </CardHeader>

        <CardContent>
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />

              <p className="text-slate-600">
                You have not enrolled in any courses yet.
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Browse the available courses below to get started.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map(
                ({ enrollment, course }) => {
                  const status = getEnrollmentStatus(
                    enrollment
                  );

                  return (
                    <Card
                      key={enrollment.id}
                      className="border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge
                            className={getSubjectColor(
                              course.subject
                            )}
                          >
                            {course.subject}
                          </Badge>

                          <Badge
                            variant="outline"
                            className={status.className}
                          >
                            {status.label}
                          </Badge>
                        </div>

                        <CardTitle className="text-lg leading-tight">
                          {course.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>
                              {course.tutor_name ||
                                "Experienced Tutor"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>
                              {course.grade_level}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {course.duration_weeks} weeks
                            </span>
                          </div>
                        </div>

                        {course.description && (
                          <p className="text-sm text-slate-600 line-clamp-3">
                            {course.description}
                          </p>
                        )}

                        {String(
                          enrollment.status || ""
                        ).toLowerCase() === "active" ||
                        String(
                          enrollment.status || ""
                        ).toLowerCase() === "approved" ? (
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Start Learning
                          </Button>
                        ) : (
                          <div className="text-center text-sm text-slate-500 py-2">
                            Waiting for admin approval
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>

          <p className="text-sm text-slate-600">
            Browse and enroll in courses taught by verified
            tutors.
          </p>
        </CardHeader>

        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />

              <p className="text-slate-600">
                No courses available at the moment.
              </p>

              <p className="text-sm text-slate-500 mt-2">
                Check back later for new courses!
              </p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coursesToShow.map((course) => {
                  const alreadyRequested =
                    isAlreadyRequested(course.id);

                  return (
                    <Card
                      key={course.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            className={getSubjectColor(
                              course.subject
                            )}
                          >
                            {course.subject}
                          </Badge>

                          {renderPrice(course)}
                        </div>

                        <CardTitle className="text-lg leading-tight">
                          {course.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm text-slate-600 mb-4">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>
                              {course.tutor_name ||
                                "Experienced Tutor"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>
                              {course.grade_level}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {course.duration_weeks} weeks
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>
                              {course.enrolled_students || 0}/
                              {course.max_students} students
                            </span>
                          </div>
                        </div>

                        {course.description && (
                          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                            {course.description.length > 100
                              ? `${course.description.substring(
                                  0,
                                  100
                                )}...`
                              : course.description}
                          </p>
                        )}

                        <Button
                          onClick={() =>
                            handleEnrollRequest(course)
                          }
                          className="w-full bg-[#1565C0] hover:bg-[#1e88e5]"
                          size="sm"
                          disabled={alreadyRequested}
                        >
                          {alreadyRequested
                            ? "Request Sent"
                            : "Request Enrollment"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {courses.length > 6 && (
                <div className="text-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setShowAllCourses(!showAllCourses)
                    }
                    className="gap-2"
                  >
                    {showAllCourses ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>View All {courses.length} Courses</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>How to Enroll</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">
                  1
                </span>
              </div>

              <h4 className="font-semibold mb-2">
                Browse Courses
              </h4>

              <p className="text-sm text-slate-600">
                Choose from our verified tutors and courses
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">
                  2
                </span>
              </div>

              <h4 className="font-semibold mb-2">
                Request Enrollment
              </h4>

              <p className="text-sm text-slate-600">
                Contact tutor and make payment
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">
                  3
                </span>
              </div>

              <h4 className="font-semibold mb-2">
                Start Learning
              </h4>

              <p className="text-sm text-slate-600">
                Join live classes and track progress
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCourse && (
        <EnrollmentRequestModal
          course={selectedCourse}
          user={user}
          open={!!selectedCourse}
          onOpenChange={() => setSelectedCourse(null)}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />
      )}
    </div>
  );
}
