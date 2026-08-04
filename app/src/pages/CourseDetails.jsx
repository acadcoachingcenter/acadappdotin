
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Course } from '@/entities/Course';
import { StudyMaterial } from '@/entities/StudyMaterial';
import { Assignment } from '@/entities/Assignment';
import { Enrollment } from '@/entities/Enrollment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, PlusCircle, Trash2, Users, UserPlus } from "lucide-react";
import AddMaterialModal from '../components/tutor/AddMaterialModal';
import AddStudentModal from '../components/tutor/AddStudentModal';
import { Link } from 'react-router-dom';


export default function CourseDetails() {
  const location = useLocation();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const courseId = new URLSearchParams(location.search).get('id');

  const loadCourseData = useCallback(async () => {
    if (!courseId) {
      console.error("No courseId found in URL");
      return;
    }
    
    console.log("Loading data for courseId:", courseId);
    setIsLoading(true);
    
    try {
      const courseData = await Course.get(courseId);
      console.log("Course data loaded:", courseData);
      setCourse(courseData);
      
      // Try to get ALL materials first, then filter manually
      const allMaterials = await StudyMaterial.list();
      console.log("All materials in system:", allMaterials);
      console.log("Number of materials found:", allMaterials.length);
      
      // Log each material's course_id for comparison
      allMaterials.forEach((material, index) => {
        console.log(`Material ${index + 1}:`, {
          id: material.id,
          title: material.title,
          course_id: material.course_id,
          course_id_type: typeof material.course_id,
          matches_current_course: material.course_id === courseId,
          courseId_type: typeof courseId
        });
      });
      
      const materialData = allMaterials.filter(material => {
        console.log(`Comparing: "${material.course_id}" (type: ${typeof material.course_id}) === "${courseId}" (type: ${typeof courseId})`, material.course_id === courseId);
        return material.course_id === courseId;
      });
      console.log("Filtered materials for this course:", materialData);
      setMaterials(materialData);

      const assignmentData = await Assignment.filter({ course_id: courseId });
      console.log("Assignment data:", assignmentData);
      setAssignments(assignmentData);
      
      const enrollmentData = await Enrollment.filter({ course_id: courseId, status: 'active' });
      console.log("Enrollment data:", enrollmentData);
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
        {/* Study Materials Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText /> Study Materials ({materials.length})
            </CardTitle>
            <Button size="sm" onClick={() => setIsMaterialModalOpen(true)}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Material
            </Button>
          </CardHeader>
          <CardContent>
            {materials.length > 0 ? (
              <ul className="space-y-2">
                {materials.map(mat => (
                  <li key={mat.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                    <div>
                      <a href={mat.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">{mat.title}</a>
                      {mat.description && <p className="text-sm text-slate-600 mt-1">{mat.description}</p>}
                      <p className="text-xs text-slate-400">ID: {mat.id}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8"><Trash2 className="w-4 h-4" /></Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500">No materials uploaded yet.</p>
                <p className="text-xs text-slate-400 mt-2">Looking for materials with course_id: {courseId}</p>
              </div>
            )}
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

      {isMaterialModalOpen && (
        <AddMaterialModal
          courseId={course.id}
          tutorId={course.tutor_id}
          open={isMaterialModalOpen}
          onOpenChange={setIsMaterialModalOpen}
          onMaterialAdded={loadCourseData}
        />
      )}
      
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
