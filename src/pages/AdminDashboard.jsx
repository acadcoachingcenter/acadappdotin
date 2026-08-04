import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { apiClient } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  IndianRupee,
  Shield,
  UserPlus,
  FolderKanban,
  ClipboardList
} from "lucide-react";
import EnrollStudentModal from "../components/admin/EnrollStudentModal";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTutors: 0,
    totalRevenue: 0,
    newInquiries: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // ------------------------------------------------
        // GET CURRENT LOGGED-IN USER FROM CLOUDFLARE API
        // ------------------------------------------------
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json"
            }
          }
        );

        if (!response.ok) {
          throw new Error(
            `Authentication failed: ${response.status}`
          );
        }

        const userData = await response.json();
        setUser(userData);

        // ------------------------------------------------
        // GET ALL USERS
        // ------------------------------------------------
        const allUsers = await User.list();

        const users = Array.isArray(allUsers)
          ? allUsers
          : allUsers?.data || [];

        // ------------------------------------------------
        // GET NEW INQUIRIES
        // ------------------------------------------------
        let newInquiryCount = 0;

        try {
          const inquiries =
            await apiClient.entities.Inquiry.filter(
              { status: "new" },
              "-inquiry_date",
              100
            );

          const inquiryList = Array.isArray(inquiries)
            ? inquiries
            : inquiries?.data || [];

          newInquiryCount = inquiryList.length;
        } catch (error) {
          console.error(
            "Error fetching inquiries:",
            error
          );
        }

        // ------------------------------------------------
        // UPDATE DASHBOARD STATS
        // ------------------------------------------------
        setStats({
          totalUsers: users.length,

          totalTutors: users.filter(
            (u) =>
              String(u.user_type || "").toLowerCase() ===
              "tutor"
          ).length,

          // Revenue API can be connected later
          totalRevenue: 0,

          newInquiries: newInquiryCount
        });

      } catch (error) {
        console.error(
          "Error loading Admin Dashboard:",
          error
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEnrollmentSuccess = () => {
    setShowEnrollModal(false);
    alert("Student enrolled successfully!");
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="bg-green-600 hover:bg-green-700"
          >
            <Link to={createPageUrl("AdminCourseManagement")}>
              <FolderKanban className="w-4 h-4 mr-2" />
              Manage Courses
            </Link>
          </Button>

          <Button
            onClick={() => setShowEnrollModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Student
          </Button>

          <div className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium">
            <Shield className="w-4 h-4 mr-1 inline" />
            ADMIN
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* TOTAL USERS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers}
            </div>
          </CardContent>
        </Card>

        {/* TOTAL TUTORS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tutors
            </CardTitle>
            <BookOpen className="h-5 w-5 text-green-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTutors}
            </div>
          </CardContent>
        </Card>

        {/* REVENUE */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue
            </CardTitle>
            <IndianRupee className="h-5 w-5 text-purple-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.totalRevenue}
            </div>
          </CardContent>
        </Card>

        {/* NEW INQUIRIES */}
        <Link
          to={createPageUrl("AdminInquiryManagement")}
          className="block"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Inquiries
              </CardTitle>
              <ClipboardList className="h-5 w-5 text-orange-600" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.newInquiries}
              </div>

              <p className="text-xs text-slate-500 mt-1">
                Click to view & manage →
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* MANAGEMENT ACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle>Management Actions</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-wrap gap-4">
          <Button
            onClick={() => setShowEnrollModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Enroll Student in Course
          </Button>

          <Button
            asChild
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Link
              to={createPageUrl(
                "AdminEnrollmentManagement"
              )}
            >
              Manage Enrollments
            </Link>
          </Button>

          <Button
            asChild
            className="bg-[#1565C0] hover:bg-[#1e88e5]"
          >
            <Link
              to={createPageUrl(
                "AdminTutorManagement"
              )}
            >
              Manage Tutors
            </Link>
          </Button>

          <Button asChild variant="secondary">
            <Link
              to={createPageUrl(
                "AdminCourseManagement"
              )}
              className="bg-lime-600 text-secondary-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary/80 h-10"
            >
              Manage Courses
            </Link>
          </Button>
        </CardContent>
      </Card>

      {showEnrollModal && (
        <EnrollStudentModal
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
          onEnrollmentSuccess={
            handleEnrollmentSuccess
          }
        />
      )}
    </div>
  );
}
