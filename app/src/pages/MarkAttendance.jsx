
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Attendance } from "@/entities/Attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Users } from "lucide-react";
import { format } from "date-fns";

export default function MarkAttendance() {
  const [user, setUser] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      // Load attendance records based on user type
      let records = [];
      if (userData.user_type === 'student') {
        // Try to find by student_id or email
        const allRecords = await Attendance.list("-class_date");
        records = allRecords.filter(record => 
          record.student_id === userData.id || 
          record.student_email?.toLowerCase() === userData.email?.toLowerCase()
        );
      } else if (userData.user_type === 'tutor') {
        records = await Attendance.filter({ tutor_id: userData.id });
      } else if (userData.user_type === 'parent') {
        // Get all attendance records for parent's children or by email
        const allRecords = await Attendance.list("-class_date");
        records = allRecords.filter(record => {
          // Check if parent_id matches or if any children_ids match
          if (record.parent_id === userData.id) return true;
          if (userData.children_ids && userData.children_ids.includes(record.student_id)) return true;
          // Also check if student email matches any child emails
          if (userData.children_emails && record.student_email) {
            return userData.children_emails.some(email => 
              email.toLowerCase() === record.student_email.toLowerCase()
            );
          }
          return false;
        });
      }

      // Filter to show only pending or recent records
      const today = new Date();
      const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
      
      records = records.filter(record => {
        const classDate = new Date(record.class_date);
        const userField = `${userData.user_type}_marked`;
        return record[userField] === 'pending' || classDate >= thirtyDaysAgo;
      });

      // Sort by date descending
      records.sort((a, b) => new Date(b.class_date) - new Date(a.class_date));

      setAttendanceRecords(records);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleMarkAttendance = async (recordId, status) => {
    try {
      const record = attendanceRecords.find(r => r.id === recordId);
      const userField = `${user.user_type}_marked`;
      const timeField = `${user.user_type}_marked_at`;

      const updates = {
        [userField]: status,
        [timeField]: new Date().toISOString()
      };

      // Calculate final status
      const studentMarked = user.user_type === 'student' ? status : record.student_marked;
      const tutorMarked = user.user_type === 'tutor' ? status : record.tutor_marked;
      const parentMarked = user.user_type === 'parent' ? status : record.parent_marked;

      // Student is present only if ALL three mark present
      if (studentMarked === 'present' && tutorMarked === 'present' && parentMarked === 'present') {
        updates.final_status = 'present';
      } else if (studentMarked !== 'pending' && tutorMarked !== 'pending' && parentMarked !== 'pending') {
        // All have marked, but not all present
        updates.final_status = 'absent';
      } else {
        updates.final_status = 'pending';
      }

      await Attendance.update(recordId, updates);
      loadData(); // Refresh the list
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Failed to mark attendance. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      present: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
      absent: { bg: "bg-red-100 text-red-800", icon: XCircle }
    };
    const { bg, icon: Icon } = styles[status] || styles.pending;
    return (
      <Badge className={`${bg} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUserMarkingStatus = (record) => {
    return {
      student: { status: record.student_marked, time: record.student_marked_at },
      tutor: { status: record.tutor_marked, time: record.tutor_marked_at },
      parent: { status: record.parent_marked, time: record.parent_marked_at }
    };
  };

  if (isLoading) {
    return <div className="p-6">Loading attendance records...</div>;
  }

  const userField = `${user.user_type}_marked`;
  const pendingRecords = attendanceRecords.filter(r => r[userField] === 'pending');
  const markedRecords = attendanceRecords.filter(r => r[userField] !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mark Attendance</h1>
          <p className="text-slate-600 mt-2">
            All three parties (Student, Tutor, Parent) must mark attendance for verification
          </p>
        </div>
      </div>

      {/* Information Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Three-Way Verification System</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Student, Tutor, and Parent must all mark attendance</li>
                <li>• Student is marked <strong>Present</strong> only if all three select "Present"</li>
                <li>• If anyone marks "Absent" or doesn't respond, student is marked <strong>Absent</strong></li>
                <li>• You can only mark attendance for your role ({user.user_type})</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Attendance */}
      {pendingRecords.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900">
            Pending Attendance ({pendingRecords.length})
          </h2>
          <div className="grid gap-4">
            {pendingRecords.map((record) => {
              const markingStatus = getUserMarkingStatus(record);
              return (
                <Card key={record.id} className="border-2 border-orange-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{record.course_name}</CardTitle>
                        <CardDescription className="mt-1">
                          Student: {record.student_name}
                        </CardDescription>
                      </div>
                      {getStatusBadge(record.final_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>{format(new Date(record.class_date), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>{record.class_time}</span>
                      </div>
                    </div>

                    {/* Marking Status Grid */}
                    <div className="grid md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-600 mb-1">Student</p>
                        {getStatusBadge(markingStatus.student.status)}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-600 mb-1">Tutor</p>
                        {getStatusBadge(markingStatus.tutor.status)}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-600 mb-1">Parent</p>
                        {getStatusBadge(markingStatus.parent.status)}
                      </div>
                    </div>

                    {/* Radio Group for Marking */}
                    <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                      <Label className="text-base font-semibold mb-3 block">
                        Mark Your Attendance:
                      </Label>
                      <RadioGroup
                        onValueChange={(value) => handleMarkAttendance(record.id, value)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="present" id={`${record.id}-present`} />
                          <Label 
                            htmlFor={`${record.id}-present`}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            Present
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="absent" id={`${record.id}-absent`} />
                          <Label 
                            htmlFor={`${record.id}-absent`}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <XCircle className="w-5 h-5 text-red-600" />
                            Absent
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Recently Marked */}
      {markedRecords.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-slate-900">
            Recently Marked
          </h2>
          <div className="grid gap-4">
            {markedRecords.map((record) => {
              const markingStatus = getUserMarkingStatus(record);
              return (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{record.course_name}</CardTitle>
                        <CardDescription className="mt-1">
                          Student: {record.student_name}
                        </CardDescription>
                      </div>
                      {getStatusBadge(record.final_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span>{format(new Date(record.class_date), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>{record.class_time}</span>
                      </div>
                    </div>

                    {/* Marking Status Grid */}
                    <div className="grid md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-600 mb-1">Student</p>
                        {getStatusBadge(markingStatus.student.status)}
                        {markingStatus.student.time && (
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(markingStatus.student.time), 'p')}
                          </p>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-600 mb-1">Tutor</p>
                        {getStatusBadge(markingStatus.tutor.status)}
                        {markingStatus.tutor.time && (
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(markingStatus.tutor.time), 'p')}
                          </p>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-600 mb-1">Parent</p>
                        {getStatusBadge(markingStatus.parent.status)}
                        {markingStatus.parent.time && (
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(markingStatus.parent.time), 'p')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-100 p-3 rounded-lg">
                      <p className="text-sm text-slate-700">
                        <strong>Your Response:</strong> {getStatusBadge(record[userField])}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {attendanceRecords.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600 text-lg">No attendance records found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
