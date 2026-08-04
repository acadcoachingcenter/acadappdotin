import React, { useState, useEffect } from "react";
import { apiClient } from "@/api/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, BookOpen, Video, File } from "lucide-react";

export default function MyStudyMaterials() {
  const [user, setUser] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = await apiClient.auth.me();
      setUser(userData);

      // Get student's enrollments
      const allEnrollments = await apiClient.entities.Enrollment.list();
      const studentEnrollments = allEnrollments.filter(e => 
        (e.student_id === userData.id || 
         e.student_email?.toLowerCase() === userData.email?.toLowerCase()) &&
        e.status === 'active'
      );
      setEnrollments(studentEnrollments);

      // Get materials for enrolled courses
      const enrolledCourseIds = studentEnrollments.map(e => e.course_id);
      
      if (enrolledCourseIds.length > 0) {
        const allMaterials = await apiClient.entities.StudyMaterial.list('-created_date');
        const studentMaterials = allMaterials.filter(m => 
          (enrolledCourseIds.includes(m.course_id) || studentEnrollments.some(e => e.tutor_id === m.tutor_id && e.course_id === m.course_id))
        );
        setMaterials(studentMaterials);
      }

    } catch (error) {
      console.error("Error loading study materials:", error);
    }
    setIsLoading(false);
  };

  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('video') || type.includes('mp4')) return <Video className="w-5 h-5 text-purple-500" />;
    if (type.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const getFileTypeColor = (fileType) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return 'bg-red-100 text-red-800';
    if (type.includes('video')) return 'bg-purple-100 text-purple-800';
    if (type.includes('doc')) return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-800';
  };

  const getCourseInfo = (courseId) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    return {
      courseName: enrollment?.course_name || 'Unknown Course',
      tutorName: enrollment?.tutor_name || 'Unknown Tutor'
    };
  };

  const handleDownload = (material) => {
    window.open(material.file_url, '_blank');
  };

  if (isLoading) {
    return <div className="p-6">Loading study materials...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Study Materials</h1>
          <p className="text-slate-600 mt-2">Access materials uploaded by your tutors</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => {
                const uploadDate = new Date(m.created_date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return uploadDate > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Study Materials</CardTitle>
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-600 text-lg mb-2">No study materials available yet</p>
              <p className="text-sm text-slate-500">
                Your tutors will upload materials for your enrolled courses
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => {
                const { courseName, tutorName } = getCourseInfo(material.course_id);
                return (
                  <div key={material.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                          {getFileIcon(material.file_type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{material.title}</h3>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge className="bg-blue-100 text-blue-800">
                              {courseName}
                            </Badge>
                            <Badge className={getFileTypeColor(material.file_type)}>
                              {material.file_type || 'File'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              By {tutorName}
                            </Badge>
                          </div>

                          {material.description && (
                            <p className="text-sm text-slate-600 mb-3">
                              {material.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => handleDownload(material)}
                              size="sm"
                              className="bg-[#1565C0] hover:bg-[#1e88e5]"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download / View
                            </Button>
                            <span className="text-xs text-slate-500">
                              Uploaded {new Date(material.created_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* No Enrollments Message */}
      {enrollments.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 mt-1">⚠️</div>
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">No Active Enrollments</h4>
                <p className="text-sm text-yellow-800">
                  You need to be enrolled in a course to access study materials. 
                  Please enroll in courses from your dashboard to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}