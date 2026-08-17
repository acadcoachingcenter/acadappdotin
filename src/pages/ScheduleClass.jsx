import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Course } from "@/entities/Course";
import { Enrollment } from "@/entities/Enrollment";
import { apiClient } from "@/api/apiClient";
import GoogleCalendarConnect from "@/components/classroom/GoogleCalendarConnect";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Calendar,
  Clock,
  Video,
  Users,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

const DEFAULT_MEET_LINK =
  "https://meet.google.com/wsb-ztxe-kwc";

export default function ScheduleClass() {
  const { user, isLoadingAuth } = useAuth();

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedCourseId, setSelectedCourseId] =
    useState("");

  const [selectedStudentIds, setSelectedStudentIds] =
    useState([]);

  const [classTitle, setClassTitle] =
    useState("");

  const [classDate, setClassDate] =
    useState("");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [meetLink, setMeetLink] =
    useState(DEFAULT_MEET_LINK);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (isLoadingAuth || !user) {
      return;
    }

    loadScheduleData();
  }, [user, isLoadingAuth]);

  const loadScheduleData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const allCourses =
        await Course.list("-created_date");

      const tutorCourses = (allCourses || []).filter(
        (course) =>
          course.tutor_id === user.id
      );

      setCourses(tutorCourses);

      const allEnrollments =
        await Enrollment.list("-created_date");

      const tutorEnrollments =
        (allEnrollments || []).filter(
          (enrollment) =>
            enrollment.tutor_id === user.id &&
            (
              enrollment.status === "active" ||
              enrollment.status === "approved"
            )
        );

      const studentMap = new Map();

      tutorEnrollments.forEach((enrollment) => {
        const studentId =
          enrollment.student_id;

        if (!studentId) {
          return;
        }

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            id: studentId,
            name:
              enrollment.student_name ||
              "Student",
            email:
              enrollment.student_email ||
              "",
            courseIds: [],
          });
        }

        const student =
          studentMap.get(studentId);

        if (
          enrollment.course_id &&
          !student.courseIds.includes(
            enrollment.course_id
          )
        ) {
          student.courseIds.push(
            enrollment.course_id
          );
        }
      });

      setStudents(
        Array.from(studentMap.values())
      );
    } catch (error) {
      console.error(
        "Error loading schedule data:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to load courses and students."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCourse =
    courses.find(
      (course) =>
        course.id === selectedCourseId
    );

  const availableStudents =
    selectedCourse
      ? students.filter((student) =>
          student.courseIds.includes(
            selectedCourse.id
          )
        )
      : students;

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);

    const course = courses.find(
      (item) => item.id === courseId
    );

    setClassTitle(
      course?.title ||
        "ACAD Live Class"
    );

    setSelectedStudentIds([]);
  };

  const toggleStudent = (studentId) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter(
          (id) => id !== studentId
        );
      }

      return [...current, studentId];
    });
  };

  const validateForm = () => {
    if (!selectedCourseId) {
      setErrorMessage(
        "Please select a course."
      );
      return false;
    }

    if (!classDate) {
      setErrorMessage(
        "Please select the class date."
      );
      return false;
    }

    if (!startTime) {
      setErrorMessage(
        "Please select the start time."
      );
      return false;
    }

    if (!endTime) {
      setErrorMessage(
        "Please select the end time."
      );
      return false;
    }

    if (endTime <= startTime) {
      setErrorMessage(
        "End time must be later than the start time."
      );
      return false;
    }

    if (selectedStudentIds.length === 0) {
      setErrorMessage(
        "Please select at least one student."
      );
      return false;
    }

    if (!meetLink.trim()) {
      setErrorMessage(
        "Google Meet link is required."
      );
      return false;
    }

    return true;
  };

  const handleSchedule = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const selectedStudents =
        availableStudents.filter(
          (student) =>
            selectedStudentIds.includes(
              student.id
            )
        );

      const payload = {
        course_id: selectedCourseId,
        course_name:
          selectedCourse?.title ||
          classTitle ||
          "ACAD Live Class",

        tutor_id: user.id,
        tutor_name:
          user.full_name ||
          user.email ||
          "Tutor",
        tutor_email:
          user.email || "",

        student_ids:
          selectedStudents.map(
            (student) => student.id
          ),

        student_emails:
          selectedStudents
            .map(
              (student) =>
                student.email
            )
            .filter(Boolean),

        student_names:
          selectedStudents.map(
            (student) =>
              student.name
          ),

        title:
          classTitle ||
          selectedCourse?.title ||
          "ACAD Live Class",

        class_date: classDate,
        start_time: startTime,
        end_time: endTime,

        
        reminder_minutes: 10,
      };

      const result =
        await apiClient.functions.invoke(
          "scheduleClass",
          payload
        );

      console.log(
        "scheduleClass response:",
        result
      );

      setSuccessMessage(
        "Class scheduled successfully. The tutor and selected students will receive the class notification."
      );

      setClassDate("");
      setStartTime("");
      setEndTime("");
      setSelectedStudentIds([]);

      setMeetLink(
        DEFAULT_MEET_LINK
      );
    } catch (error) {
      console.error(
        "Error scheduling class:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to schedule the class."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingAuth || isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#1565C0]" />
        <p className="mt-4 text-slate-600">
          Loading classroom information...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-slate-600">
          Please sign in to schedule a class.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Calendar className="w-8 h-8 text-[#1565C0]" />

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Schedule a Live Class
          </h1>

          <p className="text-slate-600 mt-1">
            Schedule a class for your enrolled students.
          </p>
        </div>
      </div>
      <GoogleCalendarConnect />

      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <p>{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form
        onSubmit={handleSchedule}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            <div className="space-y-2">
              <Label>Course</Label>

              <Select
                value={selectedCourseId}
                onValueChange={
                  handleCourseChange
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your course" />
                </SelectTrigger>

                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem
                      key={course.id}
                      value={course.id}
                    >
                      {course.title} —{" "}
                      {course.grade_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label htmlFor="classTitle">
                Class Title
              </Label>

              <Input
                id="classTitle"
                value={classTitle}
                onChange={(e) =>
                  setClassTitle(
                    e.target.value
                  )
                }
                placeholder="e.g. Mathematics – Chapter 3"
              />
            </div>


            <div className="grid md:grid-cols-3 gap-6">

              <div className="space-y-2">
                <Label htmlFor="classDate">
                  Date
                </Label>

                <Input
                  id="classDate"
                  type="date"
                  value={classDate}
                  onChange={(e) =>
                    setClassDate(
                      e.target.value
                    )
                  }
                />
              </div>


              <div className="space-y-2">
                <Label htmlFor="startTime">
                  Start Time
                </Label>

                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) =>
                      setStartTime(
                        e.target.value
                      )
                    }
                    className="pl-10"
                  />
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="endTime">
                  End Time
                </Label>

                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) =>
                      setEndTime(
                        e.target.value
                      )
                    }
                    className="pl-10"
                  />
                </div>
              </div>

            </div>


            <div className="space-y-2">
              <Label>
                Google Meet Link
              </Label>

              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <Input
                  value={meetLink}
                  onChange={(e) =>
                    setMeetLink(
                      e.target.value
                    )
                  }
                  className="pl-10"
                  placeholder={DEFAULT_MEET_LINK}
                />
              </div>

              <p className="text-xs text-slate-500">
                Default Meet link is pre-filled. The Google Calendar integration can replace this with an automatically generated Meet link.
              </p>
            </div>

          </CardContent>
        </Card>


        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students
            </CardTitle>

            <p className="text-sm text-slate-600">
              Select the enrolled students who should receive the class notification.
            </p>
          </CardHeader>

          <CardContent>

            {!selectedCourseId ? (
              <p className="text-sm text-slate-500">
                Select a course first.
              </p>
            ) : availableStudents.length === 0 ? (
              <p className="text-sm text-slate-500">
                No active students are currently enrolled in this course.
              </p>
            ) : (
              <div className="space-y-3">
                {availableStudents.map(
                  (student) => {

                    const selected =
                      selectedStudentIds.includes(
                        student.id
                      );

                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() =>
                          toggleStudent(
                            student.id
                          )
                        }
                        className={`w-full text-left border rounded-lg p-4 transition ${
                          selected
                            ? "border-[#1565C0] bg-blue-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">

                          <div>
                            <p className="font-medium text-slate-900">
                              {student.name}
                            </p>

                            <p className="text-sm text-slate-500">
                              {student.email ||
                                "No email available"}
                            </p>
                          </div>

                          {selected && (
                            <CheckCircle className="w-5 h-5 text-[#1565C0]" />
                          )}

                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}

          </CardContent>
        </Card>


        <Card>
          <CardContent className="pt-6">

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">

              <div className="flex items-start gap-3">

                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />

                <div>

                  <p className="font-medium text-blue-900">
                    Calendar notification
                  </p>

                  <p className="text-sm text-blue-800 mt-1">
                    The scheduled class will use a 10-minute reminder. The tutor and selected students will receive the class details and Google Meet link.
                  </p>

                </div>

              </div>

            </div>


            <div className="flex justify-end">

              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#1565C0] hover:bg-[#1e88e5]"
              >

                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Class
                  </>
                )}

              </Button>

            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
