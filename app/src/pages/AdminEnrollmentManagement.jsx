import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  UserPlus,
  IndianRupee,
  BookOpen,
  GraduationCap,
  Mail,
  Users,
  Phone,
  AlertCircle,
  Trash2,
  FileText
} from 'lucide-react';
import EnrollStudentModal from '../components/admin/EnrollStudentModal';
import AdmissionCardModal from '../components/admin/AdmissionCardModal';

const COURSE_DURATION_MONTHS = 6;

const StatusBadge = ({ status }) => {
  const styles = {
    pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    active: 'bg-green-100 text-green-800 border-green-300',
    completed: 'bg-blue-100 text-blue-800 border-blue-300',
    non_active: 'bg-slate-200 text-slate-700 border-slate-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <Badge
      className={`${styles[status] || 'bg-gray-100 text-gray-800'} capitalize`}
    >
      {(status || 'unknown').replace(/_/g, ' ')}
    </Badge>
  );
};

export default function AdminEnrollmentManagement() {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [admissionEnrollment, setAdmissionEnrollment] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    non_active: 0,
    monthlyRevenue: 0,
    projectedRevenue: 0
  });

  const loadEnrollments = async () => {
    setIsLoading(true);

    try {
      const result =
        await apiClient.entities.Enrollment.list('-created_date');

      const allEnrollments =
        Array.isArray(result) ? result : [];

      setEnrollments(allEnrollments);

      const monthlyRevenue = allEnrollments
        .filter((e) => e.status === 'active')
        .reduce(
          (sum, e) =>
            sum + Number(e.amount_paid || 0),
          0
        );

      const projectedRevenue =
        monthlyRevenue * COURSE_DURATION_MONTHS;

      setStats({
        total: allEnrollments.length,

        pending: allEnrollments.filter(
          (e) => e.status === 'pending_approval'
        ).length,

        active: allEnrollments.filter(
          (e) => e.status === 'active'
        ).length,

        completed: allEnrollments.filter(
          (e) => e.status === 'completed'
        ).length,

        non_active: allEnrollments.filter(
          (e) => e.status === 'non_active'
        ).length,

        monthlyRevenue,
        projectedRevenue
      });

    } catch (error) {
      console.error(
        'Error loading enrollments:',
        error
      );

      setEnrollments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  const isValidEmail = (email) => {
    if (!email) return false;
    if (email.includes('@whatsapp.temp')) return false;
    if (!email.includes('@')) return false;
    if (!email.includes('.')) return false;

    return true;
  };

  const handleApprove = async (enrollment) => {
    const student =
      enrollment.student_name ||
      enrollment.student_email ||
      enrollment.student_whatsapp ||
      'student';

    if (
      !window.confirm(
        `Approve enrollment for ${student}?`
      )
    ) {
      return;
    }

    try {
      const usersResult =
        await apiClient.entities.User.list();

      const allUsers =
        Array.isArray(usersResult)
          ? usersResult
          : [];

      const existingUser =
        enrollment.student_email
          ? allUsers.find(
              (u) =>
                u.email?.toLowerCase() ===
                enrollment.student_email?.toLowerCase()
            )
          : null;

      const updateData = {
        status: 'active'
      };

      if (existingUser) {
        updateData.student_id =
          existingUser.id;

        if (
          !enrollment.student_name ||
          enrollment.student_name ===
            enrollment.student_email
        ) {
          updateData.student_name =
            existingUser.full_name ||
            existingUser.email;
        }
      }

      await apiClient.entities.Enrollment.update(
        enrollment.id,
        updateData
      );

      if (enrollment.course_id) {
        try {
          const course =
            await apiClient.entities.Course.get(
              enrollment.course_id
            );

          if (course) {
            await apiClient.entities.Course.update(
              enrollment.course_id,
              {
                enrolled_students:
                  Number(
                    course.enrolled_students || 0
                  ) + 1
              }
            );
          }
        } catch (courseError) {
          console.error(
            'Could not update course enrollment count:',
            courseError
          );
        }
      }

      let successMessage =
        'Enrollment approved successfully!\n\n';

      const hasValidEmail =
        isValidEmail(
          enrollment.student_email
        );

      const hasWhatsApp =
        Boolean(
          enrollment.student_whatsapp &&
          enrollment.student_whatsapp.length > 0
        );

      if (hasValidEmail && existingUser) {
        try {
          await apiClient.integrations.Core.SendEmail({
            to: enrollment.student_email,

            subject:
              `Enrollment Approved - ${enrollment.course_name}`,

            body: `
              <h2>Congratulations! Your enrollment has been approved</h2>
              <p>Dear ${enrollment.student_name || existingUser.full_name || 'Student'},</p>
              <p>
                Your enrollment for the course
                <strong>${enrollment.course_name || ''}</strong>
                has been approved.
              </p>
              <p>
                Access your course at
                <a href="${window.location.origin}">
                  ACAD Platform
                </a>.
              </p>
              <p>
                Course: ${enrollment.course_name || ''}<br>
                Tutor: ${enrollment.tutor_name || ''}<br>
                Amount: ₹${enrollment.amount_paid || 0}
              </p>
              <p>Team ACAD</p>
            `
          });

          successMessage +=
            'Approval email sent to: ' +
            enrollment.student_email +
            '\n';

        } catch (emailError) {
          console.error(
            'Email could not be sent:',
            emailError
          );

          successMessage +=
            'Email could not be sent to: ' +
            enrollment.student_email +
            '\n';
        }

      } else if (
        hasValidEmail &&
        !existingUser
      ) {
        successMessage +=
          'Email: ' +
          enrollment.student_email +
          ' (student needs to register on the platform first)\n';

        successMessage +=
          'Registration: ' +
          window.location.origin +
          '\n';
      }

      if (hasWhatsApp) {
        successMessage +=
          '\nWhatsApp: ' +
          enrollment.student_whatsapp;

        successMessage +=
          '\nSend the approval message through WhatsApp if required.';
      }

      if (!hasValidEmail && !hasWhatsApp) {
        successMessage +=
          '\nNo contact information available.';
      }

      alert(successMessage);

      await loadEnrollments();

    } catch (error) {
      console.error(
        'Error approving enrollment:',
        error
      );

      alert(
        'Failed to approve enrollment: ' +
        error.message
      );
    }
  };

  const handleReject = async (enrollment) => {
    const student =
      enrollment.student_name ||
      enrollment.student_email ||
      enrollment.student_whatsapp ||
      'student';

    const reason = window.prompt(
      `Enter reason for rejecting ${student}:`
    );

    if (!reason) return;

    try {
      await apiClient.entities.Enrollment.update(
        enrollment.id,
        {
          status: 'rejected',
          remarks: `Rejected: ${reason}`
        }
      );

      let rejectionMessage =
        'Enrollment rejected\n\n';

      const hasValidEmail =
        isValidEmail(
          enrollment.student_email
        );

      const hasWhatsApp =
        Boolean(
          enrollment.student_whatsapp &&
          enrollment.student_whatsapp.length > 0
        );

      if (hasValidEmail) {
        const usersResult =
          await apiClient.entities.User.list();

        const allUsers =
          Array.isArray(usersResult)
            ? usersResult
            : [];

        const existingUser =
          allUsers.find(
            (u) =>
              u.email?.toLowerCase() ===
              enrollment.student_email?.toLowerCase()
          );

        if (existingUser) {
          try {
            await apiClient.integrations.Core.SendEmail({
              to: enrollment.student_email,

              subject:
                `Enrollment Update - ${enrollment.course_name}`,

              body: `
                <h2>Enrollment Status Update</h2>
                <p>Dear ${enrollment.student_name || 'Student'},</p>
                <p>
                  Your enrollment request for
                  <strong>${enrollment.course_name || ''}</strong>
                  was not approved.
                </p>
                <p>
                  <strong>Reason:</strong>
                  ${reason}
                </p>
                <p>
                  Contact: acadcoachingcenter@gmail.com
                  or WhatsApp: +91-9790818436
                </p>
                <p>Team ACAD</p>
              `
            });

            rejectionMessage +=
              'Rejection email sent to: ' +
              enrollment.student_email +
              '\n';

          } catch (emailError) {
            console.error(
              'Email not sent:',
              emailError
            );

            rejectionMessage +=
              'Could not send email to: ' +
              enrollment.student_email +
              '\n';
          }
        } else {
          rejectionMessage +=
            'Email: ' +
            enrollment.student_email +
            ' (user not registered)\n';
        }
      }

      if (hasWhatsApp) {
        rejectionMessage +=
          '\nWhatsApp: ' +
          enrollment.student_whatsapp;

        rejectionMessage +=
          '\nReason: ' +
          reason;
      }

      if (!hasValidEmail && !hasWhatsApp) {
        rejectionMessage +=
          '\nNo contact information available.';
      }

      alert(rejectionMessage);

      await loadEnrollments();

    } catch (error) {
      console.error(
        'Error rejecting enrollment:',
        error
      );

      alert(
        'Failed to reject enrollment: ' +
        error.message
      );
    }
  };

  const handleDelete = async (enrollment) => {
    const student =
      enrollment.student_name ||
      enrollment.student_email ||
      enrollment.student_whatsapp ||
      'student';

    if (
      !window.confirm(
        `Delete enrollment for ${student}? This cannot be undone.`
      )
    ) {
      return;
    }

    const reason = window.prompt(
      'Reason for deletion:',
      'No longer attending / out of scope'
    );

    if (reason === null) return;

    try {
      await apiClient.entities.Enrollment.delete(
        enrollment.id
      );

      if (
        enrollment.course_id &&
        enrollment.status === 'active'
      ) {
        try {
          const course =
            await apiClient.entities.Course.get(
              enrollment.course_id
            );

          if (course) {
            await apiClient.entities.Course.update(
              enrollment.course_id,
              {
                enrolled_students:
                  Math.max(
                    Number(
                      course.enrolled_students || 1
                    ) - 1,
                    0
                  )
              }
            );
          }

        } catch (courseError) {
          console.error(
            'Could not adjust course count:',
            courseError
          );
        }
      }

      alert(
        `Enrollment deleted.\nReason: ${reason}`
      );

      await loadEnrollments();

    } catch (error) {
      console.error(
        'Error deleting enrollment:',
        error
      );

      alert(
        'Failed to delete enrollment: ' +
        error.message
      );
    }
  };

  const handleStatusChange = async (
    enrollment,
    newStatus
  ) => {
    const labels = {
      completed: 'Course Completed',
      non_active: 'Non-active (Left Service)',
      active: 'Active'
    };

    if (
      !window.confirm(
        `Mark ${
          enrollment.student_name ||
          enrollment.student_email ||
          'student'
        } as "${labels[newStatus]}"?`
      )
    ) {
      return;
    }

    try {
      await apiClient.entities.Enrollment.update(
        enrollment.id,
        {
          status: newStatus
        }
      );

      alert(
        `Status updated to "${labels[newStatus]}".`
      );

      await loadEnrollments();

    } catch (error) {
      console.error(
        'Error updating status:',
        error
      );

      alert(
        'Failed to update status: ' +
        error.message
      );
    }
  };

  const handleEnrollmentSuccess = () => {
    setShowEnrollModal(false);
    loadEnrollments();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        Loading enrollments...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">
          Enrollment Management
        </h1>

        <Button
          onClick={() =>
            setShowEnrollModal(true)
          }
          className="bg-[#1565C0] hover:bg-[#1e88e5]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Enroll New Student
        </Button>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">

            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />

            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">
                Monthly Fee Structure
              </p>

              <p>
                Fees are collected monthly over a{' '}
                {COURSE_DURATION_MONTHS}-month course cycle (
                {COURSE_DURATION_MONTHS * 6} weeks).
                Each enrollment's fee shown is the monthly
                amount. Projected revenue = monthly fee ×{' '}
                {COURSE_DURATION_MONTHS} months.
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-4">

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {stats.total}
              </div>
              <div className="text-sm text-slate-600">
                Total
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
              <div className="text-sm text-slate-600">
                Pending
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <div className="text-sm text-slate-600">
                Active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.completed}
              </div>
              <div className="text-sm text-slate-600">
                Completed
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-500">
                {stats.non_active}
              </div>
              <div className="text-sm text-slate-600">
                Non-active
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ₹{stats.monthlyRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                Monthly Revenue
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                ₹{stats.projectedRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                Projected ({COURSE_DURATION_MONTHS} mo)
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Enrollment Requests
          </CardTitle>

          <p className="text-sm text-slate-600">
            Review and manage student enrollment requests.
          </p>
        </CardHeader>

        <CardContent>

          {enrollments.length === 0 ? (
            <div className="text-center py-12">

              <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />

              <p className="text-slate-600 mb-4">
                No enrollment requests found
              </p>

              <Button
                onClick={() =>
                  setShowEnrollModal(true)
                }
                className="bg-[#1565C0] hover:bg-[#1e88e5]"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll First Student
              </Button>

            </div>
          ) : (
            <div className="space-y-4">

              {enrollments.map((enrollment) => {
                const hasEmail =
                  isValidEmail(
                    enrollment.student_email
                  );

                const hasWhatsApp =
                  Boolean(
                    enrollment.student_whatsapp &&
                    enrollment.student_whatsapp.length > 0
                  );

                return (
                  <div
                    key={enrollment.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex-1">

                        <div className="flex items-center gap-3 mb-2">

                          <h3 className="font-semibold text-lg">
                            {enrollment.student_name ||
                              'Unknown Student'}
                          </h3>

                          <StatusBadge
                            status={
                              enrollment.status
                            }
                          />

                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-600 mb-2">

                          {hasEmail && (
                            <p className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              <strong>Email:</strong>
                              {' '}
                              {enrollment.student_email}
                            </p>
                          )}

                          {hasWhatsApp && (
                            <p className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400" />
                              <strong>WhatsApp:</strong>
                              {' '}
                              {enrollment.student_whatsapp}
                            </p>
                          )}

                          {!hasEmail && !hasWhatsApp && (
                            <p className="text-red-600">
                              No contact information available
                            </p>
                          )}

                          <p className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            <strong>Course:</strong>
                            {' '}
                            {enrollment.course_name}
                          </p>

                          <p className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                            <strong>Tutor:</strong>
                            {' '}
                            {enrollment.tutor_name}
                          </p>

                          <p className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-slate-400" />

                            <strong>Fee:</strong>

                            ₹{Number(
                              enrollment.amount_paid || 0
                            ).toLocaleString()}

                            <span className="text-slate-400">
                              /month
                            </span>
                          </p>

                          {enrollment.payment_transaction_id && (
                            <p>
                              <strong>
                                Transaction ID:
                              </strong>{' '}
                              {
                                enrollment.payment_transaction_id
                              }
                            </p>
                          )}

                          <p>
                            <strong>Date:</strong>{' '}
                            {new Date(
                              enrollment.enrollment_date ||
                              enrollment.created_date
                            ).toLocaleDateString()}
                          </p>

                        </div>

                        {enrollment.remarks && (
                          <div className="mt-2 p-2 bg-slate-50 rounded text-sm text-slate-700">
                            <strong>Remarks:</strong>{' '}
                            {enrollment.remarks}
                          </div>
                        )}

                        {!enrollment.student_id &&
                          enrollment.status ===
                            'pending_approval' && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">

                              Student not yet registered.

                              {hasEmail
                                ? ` Ask them to register at ${window.location.origin} with email: ${enrollment.student_email}`
                                : ' Contact via WhatsApp to provide registration details.'}

                            </div>
                          )}

                      </div>

                      <div className="flex flex-col gap-2 ml-4">

                        {enrollment.status ===
                          'pending_approval' && (
                          <div className="flex gap-2">

                            <Button
                              onClick={() =>
                                handleApprove(
                                  enrollment
                                )
                              }
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>

                            <Button
                              onClick={() =>
                                handleReject(
                                  enrollment
                                )
                              }
                              size="sm"
                              variant="destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>

                          </div>
                        )}

                        {enrollment.status ===
                          'active' && (
                          <div className="flex flex-col gap-2">

                            <Button
                              onClick={() =>
                                setAdmissionEnrollment(
                                  enrollment
                                )
                              }
                              size="sm"
                              className="bg-[#1565C0] hover:bg-[#1e88e5]"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Admission Card
                            </Button>

                            <Button
                              onClick={() =>
                                handleStatusChange(
                                  enrollment,
                                  'completed'
                                )
                              }
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Completed
                            </Button>

                            <Button
                              onClick={() =>
                                handleStatusChange(
                                  enrollment,
                                  'non_active'
                                )
                              }
                              size="sm"
                              variant="outline"
                              className="border-slate-400 text-slate-600 hover:bg-slate-100"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Mark Non-active
                            </Button>

                          </div>
                        )}

                        {(enrollment.status ===
                          'completed' ||
                          enrollment.status ===
                            'non_active') && (
                          <Button
                            onClick={() =>
                              handleStatusChange(
                                enrollment,
                                'active'
                              )
                            }
                            size="sm"
                            variant="outline"
                            className="border-green-400 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Reactivate
                          </Button>
                        )}

                        <Button
                          onClick={() =>
                            handleDelete(
                              enrollment
                            )
                          }
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>

                      </div>

                    </div>
                  </div>
                );
              })}

            </div>
          )}

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

      <AdmissionCardModal
        enrollment={admissionEnrollment}
        open={Boolean(admissionEnrollment)}
        onOpenChange={(open) => {
          if (!open) {
            setAdmissionEnrollment(null);
          }
        }}
      />

    </div>
  );
}
