import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { apiClient } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
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
import RecordTutorPaymentModal from "../components/admin/RecordTutorPaymentModal";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTutors: 0,
    grossRevenue: 0,
    tutorPayouts: 0,
    netRevenue: 0,
    newInquiries: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadData = async () => {
      try {
        // Get currently authenticated user
        const userData = await apiClient.auth.me();
        setUser(userData);

        // Get all users from Cloudflare Worker / D1
        const userResponse = await User.list();

        // Support either an array response or { data: [] }
        const allUsers = Array.isArray(userResponse)
          ? userResponse
          : Array.isArray(userResponse?.data)
            ? userResponse.data
            : [];

        console.log("Admin Dashboard users:", allUsers);

        // Get new inquiries
        let newInquiryCount = 0;

        try {
          const inquiryResponse =
            await apiClient.entities.Inquiry.filter(
              { status: "new" },
              "-inquiry_date",
              100
            );

          const inquiries = Array.isArray(inquiryResponse)
            ? inquiryResponse
            : Array.isArray(inquiryResponse?.data)
              ? inquiryResponse.data
              : [];

          newInquiryCount = inquiries.length;

          console.log(
            "Admin Dashboard new inquiries:",
            inquiries
          );
        } catch (inquiryError) {
          console.error(
            "Error fetching inquiries:",
            inquiryError
          );
        }

        // Revenue: sum of amount_paid across all enrollments that aren't
        // rejected. "Gross" is fees collected from students; "payouts" is
        // what's actually been paid out to tutors so far; "net" is the
        // difference -- what ACAD has actually kept.
        let grossRevenue = 0;
        let tutorPayouts = 0;

        try {
          const enrollmentResponse = await apiClient.entities.Enrollment.list();
          const enrollments = Array.isArray(enrollmentResponse)
            ? enrollmentResponse
            : Array.isArray(enrollmentResponse?.data)
              ? enrollmentResponse.data
              : [];

          grossRevenue = enrollments
            .filter((e) => e.status !== "rejected")
            .reduce((sum, e) => sum + (parseFloat(e.amount_paid) || 0), 0);
        } catch (revenueError) {
          console.error("Error fetching enrollments for revenue:", revenueError);
        }

        try {
          const paymentResponse = await apiClient.entities.TutorPayment.list();
          const payments = Array.isArray(paymentResponse)
            ? paymentResponse
            : Array.isArray(paymentResponse?.data)
              ? paymentResponse.data
              : [];

          tutorPayouts = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        } catch (payoutError) {
          console.error("Error fetching tutor payments:", payoutError);
        }

        // Calculate dashboard statistics
        const totalUsers = allUsers.length;

        const totalTutors = allUsers.filter((u) => {
          const userType = String(
            u?.user_type || u?.role || ""
          ).toLowerCase();

          return userType === "tutor";
        }).length;

        setStats({
          totalUsers,
          totalTutors,

          grossRevenue,
          tutorPayouts,
          netRevenue: grossRevenue - tutorPayouts,

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

  useEffect(() => {
    loadData();
  }, []);

  const handleEnrollmentSuccess = () => {
    setShowEnrollModal(false);
    alert("Student enrolled successfully!");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <h1 className="text-3xl font-bold text-slate-900">
          Admin Dashboard
        </h1>

        <div className="flex items-center gap-3">

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPaymentModal(true)}
          >
            <IndianRupee className="w-4 h-4 mr-1" />
            Record Tutor Payment
          </Button>

          <div className="px-3 py-1 bg-red-600 text-white rounded text-sm font-medium">
            <Shield className="w-4 h-4 mr-1 inline" />
            ADMIN
          </div>

        </div>
      </div>

      {/* DASHBOARD STATS */}
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

        {/* NET REVENUE */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

            <CardTitle className="text-sm font-medium">
              Net Revenue
            </CardTitle>

            <IndianRupee className="h-5 w-5 text-purple-600" />

          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.netRevenue.toLocaleString("en-IN")}
            </div>
            <div className="mt-1 text-xs text-slate-500 space-y-0.5">
              <div>Fees collected: ₹{stats.grossRevenue.toLocaleString("en-IN")}</div>
              <div>Paid to tutors: ₹{stats.tutorPayouts.toLocaleString("en-IN")}</div>
            </div>
          </CardContent>
        </Card>

        {/* NEW INQUIRIES */}
        <Link
          to={createPageUrl(
            "AdminInquiryManagement"
          )}
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
          <CardTitle>
            Management Actions
          </CardTitle>
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

          <Button
            asChild
            variant="secondary"
          >
            <Link
              to={createPageUrl(
                "AdminCourseManagement"
              )}
              className="bg-lime-600 text-secondary-foreground px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary/80 h-10"
            >
              <FolderKanban className="w-4 h-4" />
              Manage Courses
            </Link>
          </Button>

        </CardContent>
      </Card>

      {/* ENROLL STUDENT MODAL */}
      {showEnrollModal && (
        <EnrollStudentModal
          open={showEnrollModal}
          onOpenChange={setShowEnrollModal}
          onEnrollmentSuccess={
            handleEnrollmentSuccess
          }
        />
      )}

      {/* RECORD TUTOR PAYMENT MODAL */}
      {showPaymentModal && (
        <RecordTutorPaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          onPaymentRecorded={loadData}
        />
      )}

    </div>
  );
}
