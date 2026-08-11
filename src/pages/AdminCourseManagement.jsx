import React, { useState, useEffect } from "react";
import { Course } from "@/entities/Course";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  UserPlus,
  Trash2,
  MessageSquareWarning,
  X,
} from "lucide-react";
import EnrollStudentModal from "../components/admin/EnrollStudentModal";

const CourseStatusBadge = ({ status }) => {
  const statusStyles = {
    draft:
      "bg-yellow-100 text-yellow-800 border-yellow-300",
    published:
      "bg-green-100 text-green-800 border-green-300",
    archived:
      "bg-gray-100 text-gray-800 border-gray-300",
    correction_required:
      "bg-orange-100 text-orange-800 border-orange-300",
  };

  return (
    <Badge
      className={`${
        statusStyles[status] ||
        "bg-slate-100 text-slate-800 border-slate-300"
      } capitalize`}
    >
      {status === "correction_required"
        ? "Correction Required"
        : status || "Unknown"}
    </Badge>
  );
};

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showEnrollModal, setShowEnrollModal] =
    useState(false);

  const [correctionCourse, setCorrectionCourse] =
    useState(null);

  const [correctionMessage, setCorrectionMessage] =
    useState("");

  const [isSubmittingCorrection, setIsSubmittingCorrection] =
    useState(false);

  const [deletingCourseId, setDeletingCourseId] =
    useState(null);

  const fetchAllCourses = async () => {
    setIsLoading(true);

    try {
      const allCourses = await Course.list("-created_date");
      setCourses(allCourses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      alert("Error: Could not load courses.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const handlePublish = async (courseId) => {
    try {
      await Course.update(courseId, {
        status: "published",
      });

      await fetchAllCourses();
    } catch (error) {
      console.error("Failed to publish course:", error);

      alert(
        `Error: Could not publish the course. ${
          error?.message || ""
        }`
      );
    }
  };

  const openCorrectionDialog = (course) => {
    setCorrectionCourse(course);
    setCorrectionMessage("");
  };

  const closeCorrectionDialog = () => {
    if (isSubmittingCorrection) {
      return;
    }

    setCorrectionCourse(null);
    setCorrectionMessage("");
  };

  const handleSuggestCorrection = async () => {
    if (!correctionCourse) {
      return;
    }

    const message = correctionMessage.trim();

    if (!message) {
      alert(
        "Please enter the corrections that the tutor needs to make."
      );
      return;
    }

    setIsSubmittingCorrection(true);

    try {
      await Course.update(correctionCourse.id, {
        status: "correction_required",
        admin_correction_message: message,
      });

      closeCorrectionDialog();
      await fetchAllCourses();

      alert(
        "Correction request sent to the tutor successfully."
      );
    } catch (error) {
      console.error(
        "Failed to suggest course corrections:",
        error
      );

      alert(
        `Error: Could not save the correction request. ${
          error?.message || ""
        }`
      );
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${course.title}"?\n\n` +
        "This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeletingCourseId(course.id);

    try {
      await Course.delete(course.id);

      await fetchAllCourses();

      alert("Course deleted successfully.");
    } catch (error) {
      console.error("Failed to delete course:", error);

      alert(
        `Error: Could not delete the course. ${
          error?.message || ""
        }`
      );
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleEnrollmentSuccess = () => {
    setShowEnrollModal(false);
    fetchAllCourses();
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        Loading courses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Course Management
          </h1>

          <p className="text-slate-600 mt-1">
            Review, approve, correct, or delete tutor courses.
          </p>
        </div>

        <Button
          onClick={() => setShowEnrollModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Enroll Student
        </Button>
      </div>

      {/* Course list */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">
              No courses have been created yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <CardTitle className="mb-1">
                      {course.title}
                    </CardTitle>

                    <CardDescription>
                      by {course.tutor_name || "N/A"}
                    </CardDescription>
                  </div>

                  <CourseStatusBadge
                    status={course.status}
                  />
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6">
                  {/* Course information */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                      {course.subject} •{" "}
                      {course.grade_level}
                    </p>

                    <p className="font-semibold text-lg">
                      ₹{course.price}
                    </p>

                    {course.description && (
                      <p className="text-sm text-slate-600 max-w-3xl">
                        {course.description}
                      </p>
                    )}

                    {course.admin_correction_message && (
                      <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 max-w-3xl">
                        <div className="flex items-center gap-2 text-orange-800 font-medium">
                          <MessageSquareWarning className="w-4 h-4" />
                          Previous Correction
                        </div>

                        <p className="text-sm text-orange-700 mt-1">
                          {course.admin_correction_message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {course.status === "draft" && (
                      <Button
                        onClick={() =>
                          handlePublish(course.id)
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publish Course
                      </Button>
                    )}

                    {course.status ===
                      "correction_required" && (
                      <Button
                        onClick={() =>
                          handlePublish(course.id)
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Publish Course
                      </Button>
                    )}

                    {course.status === "published" && (
                      <div className="text-green-600 flex items-center gap-2 px-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>Published</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      onClick={() =>
                        openCorrectionDialog(course)
                      }
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <MessageSquareWarning className="w-4 h-4 mr-2" />
                      Suggest Corrections
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        handleDelete(course)
                      }
                      disabled={
                        deletingCourseId === course.id
                      }
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />

                      {deletingCourseId === course.id
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enrollment modal */}
      {showEnrollModal && (
        <EnrollStudentModal
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
          onEnrollmentSuccess={handleEnrollmentSuccess}
        />
      )}

      {/* Suggest Corrections modal */}
      {correctionCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Suggest Corrections
                </h2>

                <p className="text-sm text-slate-600 mt-1">
                  {correctionCourse.title}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeCorrectionDialog}
                disabled={isSubmittingCorrection}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="correction-message"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Corrections required
                </label>

                <textarea
                  id="correction-message"
                  value={correctionMessage}
                  onChange={(e) =>
                    setCorrectionMessage(e.target.value)
                  }
                  placeholder="Example: Please update the course description, add the learning objectives, and correct the course duration."
                  rows={6}
                  className="w-full rounded-md border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isSubmittingCorrection}
                />
              </div>

              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                <p className="text-sm text-orange-800">
                  The course will be marked as{" "}
                  <strong>Correction Required</strong>. The
                  tutor can make the requested changes before
                  the course is published.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={closeCorrectionDialog}
                  disabled={isSubmittingCorrection}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleSuggestCorrection}
                  disabled={
                    isSubmittingCorrection ||
                    !correctionMessage.trim()
                  }
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <MessageSquareWarning className="w-4 h-4 mr-2" />

                  {isSubmittingCorrection
                    ? "Saving..."
                    : "Send Correction Request"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
