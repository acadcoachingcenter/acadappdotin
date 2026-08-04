import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, IndianRupee, PlusCircle, RefreshCw, Settings, CalendarDays, MapPin, Mail, Phone, Download } from "lucide-react";

export default function TutorDashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);
      
      if (userData && userData.id) {
        // Get ALL courses and filter manually in JavaScript, sorted by creation date
        const allCourses = await base44.entities.Course.list("-created_date");
        const tutorCourses = allCourses.filter(course => course.tutor_id === userData.id);
        setCourses(tutorCourses);
        
        // Get all enrollments for tutor's courses (only active/approved ones)
        const allEnrollments = await base44.entities.Enrollment.list("-created_date");
        const tutorEnrollments = allEnrollments.filter(enrollment => 
          enrollment.tutor_id === userData.id && 
          enrollment.status === 'active'
        );
        setEnrollments(tutorEnrollments);
        
        const totalStudents = tutorCourses.reduce((sum, course) => sum + (course.enrolled_students || 0), 0);
        const totalEarnings = tutorEnrollments.reduce((sum, enrollment) => sum + (enrollment.amount_paid || 0), 0);
        
        setStats({
          totalCourses: tutorCourses.length,
          totalStudents: totalStudents,
          totalEarnings: totalEarnings,
        });
      }
      
    } catch (error) {
      console.error("Error loading tutor data:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'WhatsApp', 'Course', 'Fees Paid', 'Enrollment Date'];
    
    const rows = enrollments.map(enrollment => [
      enrollment.student_name || 'N/A',
      enrollment.student_email || 'N/A',
      enrollment.student_whatsapp || 'N/A',
      enrollment.course_name || 'N/A',
      `₹${enrollment.amount_paid || 0}`,
      new Date(enrollment.enrollment_date || enrollment.created_date).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_list_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-1/2 bg-slate-200 rounded animate-pulse"></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Welcome, {user?.full_name || user?.email || 'Tutor'}!
      </h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-slate-600 mt-1">
              {stats.totalCourses === 0 ? 'No courses found' : `Total courses you've created`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-slate-600 mt-1">Active enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <IndianRupee className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-slate-600 mt-1">From active enrollments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button asChild className="bg-[#1565C0] hover:bg-[#1e88e5]">
            <Link to={createPageUrl("MonthlyAttendance")}>
              <CalendarDays className="w-4 h-4 mr-2" />
              Mark Attendance
            </Link>
          </Button>
          
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link to={createPageUrl("CreateCourse")}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create New Course
            </Link>
          </Button>
          
          <Button asChild variant="secondary">
            <Link to={createPageUrl("MyCourses")}>
              <BookOpen className="w-4 h-4 mr-2" />
              View My Courses
            </Link>
          </Button>
          
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link to={createPageUrl("FindHomeTuitions")}>
              <MapPin className="w-4 h-4 mr-2" />
              Find Home Tuitions
            </Link>
          </Button>
          
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>

      {/* All Students Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All My Students</CardTitle>
              <p className="text-sm text-slate-600 mt-1">Active enrolled students across all courses</p>
            </div>
            {enrollments.length > 0 && (
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 mb-2">No students enrolled yet</p>
              <p className="text-sm text-slate-500">Students will appear here once their enrollment is approved by admin</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="text-left p-3 font-semibold text-slate-900">#</th>
                    <th className="text-left p-3 font-semibold text-slate-900">Student Name</th>
                    <th className="text-left p-3 font-semibold text-slate-900">Course</th>
                    <th className="text-left p-3 font-semibold text-slate-900">Contact</th>
                    <th className="text-right p-3 font-semibold text-slate-900">Fees Paid</th>
                    <th className="text-center p-3 font-semibold text-slate-900">Status</th>
                    <th className="text-center p-3 font-semibold text-slate-900">Enrolled On</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment, index) => (
                    <tr 
                      key={enrollment.id} 
                      className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 text-slate-600">{index + 1}</td>
                      <td className="p-3">
                        <div className="font-medium text-slate-900">
                          {enrollment.student_name || 'Unknown Student'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-slate-900">{enrollment.course_name}</div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {enrollment.student_email && !enrollment.student_email.includes('@whatsapp.temp') && (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Mail className="w-3 h-3" />
                              {enrollment.student_email}
                            </div>
                          )}
                          {enrollment.student_whatsapp && (
                            <div className="flex items-center gap-1 text-xs text-slate-600">
                              <Phone className="w-3 h-3" />
                              {enrollment.student_whatsapp}
                            </div>
                          )}
                          {!enrollment.student_email && !enrollment.student_whatsapp && (
                            <span className="text-xs text-slate-400">No contact info</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold text-green-600">
                          ₹{(enrollment.amount_paid || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Active
                        </Badge>
                      </td>
                      <td className="p-3 text-center text-sm text-slate-600">
                        {new Date(enrollment.enrollment_date || enrollment.created_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-300">
                    <td colSpan="4" className="p-3 text-right font-semibold text-slate-900">
                      Total ({enrollments.length} students):
                    </td>
                    <td className="p-3 text-right font-bold text-green-600">
                      ₹{enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0).toLocaleString()}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Recent Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Recent Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length > 0 ? (
            <div className="space-y-4">
              {courses.slice(0, 5).map(course => (
                <div key={course.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">{course.title}</h4>
                    <p className="text-sm text-slate-600">
                      {enrollments.filter(e => e.course_id === course.id).length} active students
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to={createPageUrl(`CourseDetails?id=${course.id}`)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-slate-500 text-center py-4">You have not created any courses yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}