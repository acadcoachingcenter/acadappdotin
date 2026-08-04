
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Download, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceManagement() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourseEnrollments, setSelectedCourseEnrollments] = useState([]);
  
  const [formData, setFormData] = useState({
    course_id: "",
    class_date: "",
    class_time: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Load tutor's courses
      const allCourses = await base44.entities.Course.list();
      const tutorCourses = allCourses.filter(c => c.tutor_id === userData.id && c.status === 'published');
      setCourses(tutorCourses);

      // Load attendance records for tutor's courses
      const allAttendance = await base44.entities.Attendance.list("-class_date");
      const tutorAttendance = allAttendance.filter(a => a.tutor_id === userData.id);
      setAttendanceRecords(tutorAttendance);

    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleCourseChange = async (courseId) => {
    setFormData({...formData, course_id: courseId});
    
    // Load enrollments for selected course to show preview
    try {
      // Assuming 'user' is already loaded and contains the current tutor's ID
      if (!user) {
        console.warn("User not loaded yet, cannot fetch enrollments.");
        setSelectedCourseEnrollments([]);
        return;
      }
      const allEnrollments = await base44.entities.Enrollment.list();
      const courseEnrollments = allEnrollments.filter(e => 
        e.course_id === courseId && 
        e.status === 'active' &&
        e.tutor_id === user.id // Filter for current tutor's enrollments only
      );
      setSelectedCourseEnrollments(courseEnrollments);
    } catch (error) {
      console.error("Error loading enrollments:", error);
      setSelectedCourseEnrollments([]);
    }
  };

  const handleCreateAttendance = async () => {
    if (!formData.course_id || !formData.class_date || !formData.class_time) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Get all enrollments for this course
      const allEnrollments = await base44.entities.Enrollment.list();
      const courseEnrollments = allEnrollments.filter(e => 
        e.course_id === formData.course_id && 
        e.status === 'active' &&
        e.tutor_id === user.id
      );

      if (courseEnrollments.length === 0) {
        alert("No active students found in this course. Please ensure students are enrolled and approved by admin.");
        return;
      }

      const selectedCourse = courses.find(c => c.id === formData.course_id);

      // Create attendance record for each enrolled student
      const attendancePromises = courseEnrollments.map(async (enrollment) => {
        // Get parent info if student is registered
        let parentId = null;
        let parentName = null;
        
        if (enrollment.student_id) {
          try {
            const studentData = await base44.entities.User.get(enrollment.student_id);
            parentId = studentData.parent_id || null;
            parentName = studentData.parent_name || null;
          } catch (error) {
            console.log("Student not fully registered yet:", error);
          }
        }
        
        return base44.entities.Attendance.create({
          student_id: enrollment.student_id || null,
          student_name: enrollment.student_name,
          student_email: enrollment.student_email,
          course_id: formData.course_id,
          course_name: selectedCourse.title,
          tutor_id: user.id,
          tutor_name: user.full_name || user.email,
          parent_id: parentId,
          parent_name: parentName,
          class_date: formData.class_date,
          class_time: formData.class_time,
          student_marked: 'pending',
          tutor_marked: 'pending',
          parent_marked: 'pending',
          final_status: 'pending'
        });
      });

      await Promise.all(attendancePromises);
      
      setFormData({ course_id: "", class_date: "", class_time: "" });
      setSelectedCourseEnrollments([]); // Clear enrollments preview
      setShowCreateForm(false);
      loadData();
      
      alert(`✅ Attendance records created for ${courseEnrollments.length} student(s)`);
    } catch (error) {
      console.error("Error creating attendance:", error);
      alert("Failed to create attendance records. Error: " + error.message);
    }
  };

  const downloadAttendanceReport = () => {
    // Simple CSV export
    const headers = ["Date", "Time", "Course", "Student", "Student Status", "Tutor Status", "Parent Status", "Final Status"];
    const rows = attendanceRecords.map(record => [
      record.class_date,
      record.class_time,
      record.course_name,
      record.student_name,
      record.student_marked,
      record.tutor_marked,
      record.parent_marked,
      record.final_status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Attendance Management</h1>
        <div className="flex gap-3">
          <Button onClick={downloadAttendanceReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Attendance
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Attendance Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select 
                  value={formData.course_id} 
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title} ({course.enrolled_students || 0} students)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class Date</Label>
                <Input
                  type="date"
                  value={formData.class_date}
                  onChange={(e) => setFormData({...formData, class_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Class Time</Label>
                <Input
                  type="text"
                  value={formData.class_time}
                  onChange={(e) => setFormData({...formData, class_time: e.target.value})}
                  placeholder="e.g., 10:00 AM - 11:00 AM"
                />
              </div>
            </div>

            {/* Show enrolled students preview */}
            {formData.course_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">
                      Students in this course: {selectedCourseEnrollments.length}
                    </h4>
                    {selectedCourseEnrollments.length > 0 ? (
                      <ul className="text-sm text-blue-800 mt-2 space-y-1">
                        {selectedCourseEnrollments.map((enrollment, idx) => (
                          <li key={enrollment.id}>
                            {idx + 1}. {enrollment.student_name} ({enrollment.student_email})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-blue-800 mt-2">
                        No active students found in this course. Students must be enrolled and approved by admin first.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false);
                setSelectedCourseEnrollments([]);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAttendance}
                disabled={selectedCourseEnrollments.length === 0}
              >
                Create Attendance Records
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {attendanceRecords.filter(r => r.final_status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendanceRecords.filter(r => r.final_status === 'present').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {attendanceRecords.filter(r => r.final_status === 'absent').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-center py-3 px-4">Student</th>
                  <th className="text-center py-3 px-4">Tutor</th>
                  <th className="text-center py-3 px-4">Parent</th>
                  <th className="text-center py-3 px-4">Final</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.slice(0, 20).map(record => (
                  <tr key={record.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4">{format(new Date(record.class_date), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-4">{record.class_time}</td>
                    <td className="py-3 px-4">{record.course_name}</td>
                    <td className="py-3 px-4">{record.student_name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.student_marked === 'present' ? 'bg-green-100 text-green-800' :
                        record.student_marked === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.student_marked}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.tutor_marked === 'present' ? 'bg-green-100 text-green-800' :
                        record.tutor_marked === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.tutor_marked}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.parent_marked === 'present' ? 'bg-green-100 text-green-800' :
                        record.parent_marked === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.parent_marked}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.final_status === 'present' ? 'bg-green-100 text-green-800' :
                        record.final_status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.final_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
