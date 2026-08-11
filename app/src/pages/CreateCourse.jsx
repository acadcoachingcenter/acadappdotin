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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { BookOpen, Save, AlertCircle } from "lucide-react";

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Social Science",
  "Computer Science",
  "Economics",
  "Accountancy",
  "Business Studies",
  "Others",
  "Combo",
];

const GRADES = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Undergraduate",
  "Graduate",
];

export default function CreateCourse() {
  const navigate = useNavigate();

  // Use the existing ACAD authentication system.
  // Do NOT use User.me() here.
  const { user, isLoadingAuth } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    grade_level: "",
    price: "",
    duration_weeks: "",
    max_students: "",
  });

  // Wait for AuthContext to finish loading.
  // If the authenticated user is not a tutor, return to Welcome.
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
    }
  }, [user, isLoadingAuth, navigate]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "title",
      "description",
      "subject",
      "grade_level",
      "price",
      "duration_weeks",
      "max_students",
    ];

    const emptyFields = requiredFields.filter(
      (field) =>
        !formData[field] ||
        formData[field].toString().trim() === ""
    );

    if (emptyFields.length > 0) {
      setError(
  "Please fill in all required fields: " +
    emptyFields.join(", ")
);
      return false;
    }

    const price = parseInt(formData.price, 10);
    const duration = parseInt(formData.duration_weeks, 10);
    const maxStudents = parseInt(formData.max_students, 10);

    if (Number.isNaN(price) || price <= 0) {
      setError("Please enter a valid price greater than 0");
      return false;
    }

    if (Number.isNaN(duration) || duration <= 0) {
      setError("Please enter a valid duration in weeks");
      return false;
    }

    if (Number.isNaN(maxStudents) || maxStudents <= 0) {
      setError(
        "Please enter a valid maximum number of students"
      );
      return false;
    }

    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (isLoadingAuth) {
      return;
    }

    if (!user) {
      setError("You must be logged in to create a course.");
      return;
    }

    if (user.user_type !== "tutor") {
      setError("Only tutors can create courses.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const courseData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        grade_level: formData.grade_level,
        price: parseInt(formData.price, 10),
        duration_weeks: parseInt(formData.duration_weeks, 10),
        max_students: parseInt(formData.max_students, 10),

        // Authenticated ACAD tutor
        tutor_id: user.id,
        tutor_name: user.full_name || user.email,

        status: "draft",
        enrolled_students: 0,
      };

      await Course.create(courseData);

      alert(
        "Course created successfully! It is now pending admin approval."
      );

      navigate(createPageUrl("MyCourses"));
    } catch (error) {
      console.error("Error creating course:", error);

      setError(
        `Failed to create course: ${
          error?.message || "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Do not redirect or show an error while AuthContext is still loading.
  if (isLoadingAuth) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1565C0] mx-auto" />
          <p className="text-lg mt-4 text-slate-600">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  // If authentication has completed and there is no user,
  // the useEffect above will redirect to Welcome.
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <p className="text-lg text-slate-600">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  // If a non-tutor reaches this page, the useEffect above will redirect.
  if (user.user_type !== "tutor") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <p className="text-lg text-slate-600">
            Checking account permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <BookOpen className="w-8 h-8 text-[#1565C0]" />

        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Create a New Course
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Tutor: {user.full_name || user.email}
          </p>
        </div>
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

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>

            <p className="text-slate-600">
              Fill in the information about the course you want
              to teach.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Course Title *
              </Label>

              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  updateField("title", e.target.value)
                }
                placeholder="e.g., Introduction to Algebra"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Course Description *
              </Label>

              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value
                  )
                }
                placeholder="Describe what students will learn in this course."
                className="h-24"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subject">
                  Subject *
                </Label>

                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    updateField("subject", value)
                  }
                  required
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>

                  <SelectContent>
                    {SUBJECTS.map((subject) => (
                      <SelectItem
                        key={subject}
                        value={subject}
                      >
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade_level">
                  Grade Level *
                </Label>

                <Select
                  value={formData.grade_level}
                  onValueChange={(value) =>
                    updateField(
                      "grade_level",
                      value
                    )
                  }
                  required
                >
                  <SelectTrigger id="grade_level">
                    <SelectValue placeholder="Select a grade level" />
                  </SelectTrigger>

                  <SelectContent>
                    {GRADES.map((grade) => (
                      <SelectItem
                        key={grade}
                        value={grade}
                      >
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (₹) *
                </Label>

                <Input
                  id="price"
                  type="number"
                  min="1"
                  value={formData.price}
                  onChange={(e) =>
                    updateField(
                      "price",
                      e.target.value
                    )
                  }
                  placeholder="e.g., 5000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_weeks">
                  Duration (Weeks) *
                </Label>

                <Input
                  id="duration_weeks"
                  type="number"
                  min="1"
                  value={formData.duration_weeks}
                  onChange={(e) =>
                    updateField(
                      "duration_weeks",
                      e.target.value
                    )
                  }
                  placeholder="e.g., 8"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_students">
                  Max Students *
                </Label>

                <Input
                  id="max_students"
                  type="number"
                  min="1"
                  value={formData.max_students}
                  onChange={(e) =>
                    updateField(
                      "max_students",
                      e.target.value
                    )
                  }
                  placeholder="e.g., 25"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || isLoadingAuth}
                className="bg-[#1565C0] hover:bg-[#1e88e5]"
              >
                {isSaving
                  ? "Saving..."
                  : "Create Course"}

                <Save className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
