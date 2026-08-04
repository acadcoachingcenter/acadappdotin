import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday } from "date-fns";

export default function MonthlyAttendance() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' or 'view'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadEnrollments();
    }
  }, [selectedCourse, currentDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await apiClient.auth.me();
      setUser(userData);

      // Load courses based on user type
      const allCourses = await apiClient.entities.Course.list();
      
      let userCourses = [];
      if (userData.user_type === 'tutor') {
        userCourses = allCourses.filter(c => c.tutor_id === userData.id && c.status === 'published');
        setViewMode('edit');
      } else if (userData.user_type === 'admin') {
        userCourses = allCourses.filter(c => c.status === 'published');
        setViewMode('edit');
      } else if (userData.user_type === 'student') {
        // Get student's enrolled courses
        const allEnrollments = await apiClient.entities.Enrollment.list();
        const studentEnrollments = allEnrollments.filter(e => 
          (e.student_id === userData.id || e.student_email?.toLowerCase() === userData.email?.toLowerCase()) &&
          e.status === 'active'
        );
        const enrolledCourseIds = studentEnrollments.map(e => e.course_id);
        userCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id));
        setViewMode('view');
      } else if (userData.user_type === 'parent') {
        // Get parent's children courses
        const allEnrollments = await apiClient.entities.Enrollment.list();
        const childEnrollments = allEnrollments.filter(e => e.status === 'active');
        const enrolledCourseIds = childEnrollments.map(e => e.course_id);
        userCourses = allCourses.filter(c => enrolledCourseIds.includes(c.id));
        setViewMode('view');
      }
      
      setCourses(userCourses);
      
      if (userCourses.length > 0) {
        setSelectedCourse(userCourses[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const loadEnrollments = async () => {
    if (!selectedCourse) return;

    try {
      const allEnrollments = await apiClient.entities.Enrollment.list();
      const courseEnrollments = allEnrollments.filter(e => 
        e.course_id === selectedCourse && 
        e.status === 'active'
      );
      setEnrollments(courseEnrollments);

      // Load existing attendance for this month
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const allAttendance = await apiClient.entities.Attendance.list();
      const monthlyAttendance = allAttendance.filter(a => {
        const classDate = new Date(a.class_date);
        return a.course_id === selectedCourse && 
               classDate >= monthStart && 
               classDate <= monthEnd;
      });

      // Organize attendance data by student and date
      const dataMap = {};
      monthlyAttendance.forEach(record => {
        const key = `${record.student_id || record.student_email}_${record.class_date}`;
        dataMap[key] = record.final_status || 'pending';
      });
      
      setAttendanceData(dataMap);
    } catch (error) {
      console.error("Error loading enrollments:", error);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  };

  const handleAttendanceChange = (studentId, date, status) => {
    const key = `${studentId}_${format(date, 'yyyy-MM-dd')}`;
    setAttendanceData(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const handleSaveAttendance = async () => {
    if (!window.confirm("Save attendance for all students this month?")) return;

    setIsSaving(true);
    try {
      const selectedCourseData = courses.find(c => c.id === selectedCourse);
      const days = getDaysInMonth();

      const promises = [];

      for (const enrollment of enrollments) {
        for (const day of days) {
          // Skip weekends if desired
          if (isSaturday(day) || isSunday(day)) continue;

          const dateStr = format(day, 'yyyy-MM-dd');
          const key = `${enrollment.student_id || enrollment.student_email}_${dateStr}`;
          const status = attendanceData[key];

          if (!status || status === 'pending') continue;

          // Check if attendance record exists
          const allAttendance = await apiClient.entities.Attendance.list();
          const existing = allAttendance.find(a => 
            a.course_id === selectedCourse &&
            (a.student_id === enrollment.student_id || a.student_email === enrollment.student_email) &&
            a.class_date === dateStr
          );

          if (existing) {
            // Update existing record
            promises.push(
              apiClient.entities.Attendance.update(existing.id, {
                tutor_marked: status,
                student_marked: status,
                parent_marked: status,
                tutor_marked_at: new Date().toISOString(),
                final_status: status
              })
            );
          } else {
            // Create new record
            promises.push(
              apiClient.entities.Attendance.create({
                student_id: enrollment.student_id || null,
                student_name: enrollment.student_name,
                student_email: enrollment.student_email,
                course_id: selectedCourse,
                course_name: selectedCourseData.title,
                tutor_id: user.id,
                tutor_name: user.full_name || user.email,
                class_date: dateStr,
                class_time: "Regular Class",
                tutor_marked: status,
                student_marked: status,
                parent_marked: status,
                tutor_marked_at: new Date().toISOString(),
                final_status: status
              })
            );
          }
        }
      }

      await Promise.all(promises);
      alert("✅ Attendance saved successfully!");
      loadEnrollments();
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("❌ Failed to save attendance. Please try again.");
    }
    setIsSaving(false);
  };

  const exportToCSV = () => {
    const days = getDaysInMonth();
    const headers = ['Student Name', 'Grade', ...days.map(d => format(d, 'dd MMM'))];
    
    const rows = enrollments.map(enrollment => {
      const row = [
        enrollment.student_name,
        enrollment.student_email || 'N/A'
      ];
      
      days.forEach(day => {
        if (isSaturday(day) || isSunday(day)) {
          row.push('Holiday');
        } else {
          const key = `${enrollment.student_id || enrollment.student_email}_${format(day, 'yyyy-MM-dd')}`;
          const status = attendanceData[key] || '-';
          row.push(
            status === 'present' ? 'P' : 
            status === 'absent' ? 'A' : 
            status === 'leave' ? 'L' : 
            status === 'cancelled' ? 'C' : '-'
          );
        }
      });
      
      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${format(currentDate, 'MMMM_yyyy')}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300';
      case 'absent': return 'bg-red-100 text-red-800 border-red-300';
      case 'leave': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'present': return 'P';
      case 'absent': return 'A';
      case 'leave': return 'L';
      case 'cancelled': return 'C';
      default: return '-';
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  if (isLoading) {
    return <div className="p-6">Loading attendance data...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">
              {user?.user_type === 'tutor' ? 
                "No courses available. Please create a course first." :
                "No courses enrolled yet. Please enroll in a course to view attendance."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = getDaysInMonth();
  const isEditable = viewMode === 'edit';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Monthly Attendance</h1>
          <p className="text-slate-600 mt-1">
            {isEditable ? 'Mark attendance for all students in a month' : 'View your monthly attendance records'}
          </p>
        </div>
        {isEditable && (
          <div className="flex gap-3">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={handleSaveAttendance} 
              className="bg-[#1565C0] hover:bg-[#1e88e5]"
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save All"}
            </Button>
          </div>
        )}
        {!isEditable && (
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        )}
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Select Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[200px]">
                <div className="text-xl font-bold text-slate-900">
                  {format(currentDate, 'MMMM yyyy')}
                </div>
                <div className="text-sm text-slate-600">
                  {enrollments.length} students enrolled
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm font-medium">Present (P)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-sm font-medium">Absent (A)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
              <span className="text-sm font-medium">Leave (L)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 border-2 border-purple-300 rounded"></div>
              <span className="text-sm font-medium">Class Cancelled (C)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-100 border-2 border-slate-300 rounded"></div>
              <span className="text-sm font-medium">Not Marked (-)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span className="text-sm font-medium">Weekend</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Grid */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-300 p-3 text-left font-semibold text-slate-900 sticky left-0 bg-slate-50 z-10 min-w-[200px]">
                    Student Name
                  </th>
                  <th className="border border-slate-300 p-3 text-left font-semibold text-slate-900 sticky left-[200px] bg-slate-50 z-10 min-w-[150px]">
                    Grade/Email
                  </th>
                  {days.map((day, index) => (
                    <th 
                      key={index} 
                      className={`border border-slate-300 p-2 text-center font-semibold text-xs min-w-[100px] ${
                        isSaturday(day) || isSunday(day) ? 'bg-blue-50 text-blue-900' : 'bg-slate-50 text-slate-900'
                      }`}
                    >
                      <div>{format(day, 'EEE')}</div>
                      <div className="text-lg">{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 2} className="border border-slate-300 p-8 text-center text-slate-600">
                      No students enrolled in this course yet.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 p-3 font-medium text-slate-900 sticky left-0 bg-white z-10">
                        {enrollment.student_name}
                      </td>
                      <td className="border border-slate-300 p-3 text-sm text-slate-600 sticky left-[200px] bg-white z-10">
                        {enrollment.student_email || 'N/A'}
                      </td>
                      {days.map((day, index) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const key = `${enrollment.student_id || enrollment.student_email}_${dateStr}`;
                        const status = attendanceData[key] || 'pending';
                        const isWeekend = isSaturday(day) || isSunday(day);

                        return (
                          <td 
                            key={index} 
                            className={`border border-slate-300 p-1 ${isWeekend ? 'bg-blue-50' : ''}`}
                          >
                            {isWeekend ? (
                              <div className="text-center text-xs text-blue-600 font-medium py-2">
                                Holiday
                              </div>
                            ) : isEditable ? (
                              <Select
                                value={status}
                                onValueChange={(value) => handleAttendanceChange(
                                  enrollment.student_id || enrollment.student_email,
                                  day,
                                  value
                                )}
                              >
                                <SelectTrigger className={`w-full h-10 text-xs border-2 ${getStatusColor(status)}`}>
                                  <SelectValue>
                                    {getStatusDisplay(status)}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Not Marked</SelectItem>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="leave">Leave</SelectItem>
                                  <SelectItem value="cancelled">Class Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className={`text-center text-sm font-bold py-2 rounded border-2 ${getStatusColor(status)}`}>
                                {getStatusDisplay(status)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{enrollments.length}</div>
              <div className="text-sm text-slate-600">Total Students</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(attendanceData).filter(s => s === 'present').length}
              </div>
              <div className="text-sm text-slate-600">Present</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(attendanceData).filter(s => s === 'absent').length}
              </div>
              <div className="text-sm text-slate-600">Absent</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(attendanceData).filter(s => s === 'leave').length}
              </div>
              <div className="text-sm text-slate-600">Leave</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(attendanceData).filter(s => s === 'cancelled').length}
              </div>
              <div className="text-sm text-slate-600">Cancelled</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}