import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FileText,
  Pencil,
  Save,
  X,
  PlusCircle
} from 'lucide-react';
import EnrollStudentModal from '../components/admin/EnrollStudentModal';
import AdmissionCardModal from '../components/admin/AdmissionCardModal';

const COURSE_DURATION_MONTHS = 6;

// Quick-select subjects for NEET/JEE-track masterclasses. Course name here
// is free text (unlike EnrollStudentModal, which picks from the real Course
// catalog) - these buttons exist so admin doesn't have to retype the exact
// phrasing by hand each time. Consistent naming matters beyond tidiness:
// the NEET/JEE Smart-Tutor's eligibility check matches on the whole words
// "NEET" or "JEE" appearing in the course/enrollment title, so a typo'd or
// reworded name can silently leave a student without Smart-Tutor access.
const NEET_JEE_SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Math'];
const neetJeeCourseName = (subject) => `${subject} Masterclass for NEET & JEE`;

function NeetJeeQuickSelect({ onPick }) {
  return (
    <div className="mb-1.5 flex flex-wrap gap-1.5">
      {NEET_JEE_SUBJECTS.map((subject) => (
        <button
          key={subject}
          type="button"
          onClick={() => onPick(neetJeeCourseName(subject))}
          className="rounded-full border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
        >
          {subject} (NEET/JEE)
        </button>
      ))}
    </div>
  );
}

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

  // Admission card now takes the full group of a student's active courses,
  // not a single enrollment - see getStudentEnrollments below.
  const [admissionEnrollments, setAdmissionEnrollments] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Inline "Add Course" mini-form state - anchored to the enrollment card
  // it was opened from, so a new Enrollment record (same student contact
  // info) can be created for an additional course without leaving the page.
  const [addCourseForId, setAddCourseForId] = useState(null);
  const [addCourseForm, setAddCourseForm] = useState({
    course_name: '',
    tutor_name: '',
    amount_paid: ''
  });
  const [isAddingCourse, setIsAddingCourse] = useState(false);

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

  // Finds every other ACTIVE enrollment belonging to the same student as
  // `enrollment`, matched by student_id when both sides have one, otherwise
  // by email (ignoring the synthetic @whatsapp.temp placeholder) or by
  // WhatsApp number. Used to build a single combined admission card that
  // lists every course a student is currently taking.
  const getStudentEnrollments = (enrollment, allEnrollments) => {
    const normWhatsapp = (w) =>
      (w || '').replace(/\D/g, '');

    const matches = allEnrollments.filter((e) => {
      if (e.status !== 'active') return false;

      if (enrollment.student_id && e.student_id) {
        return e.student_id === enrollment.student_id;
      }

      const emailA = enrollment.student_email || '';
      const emailB = e.student_email || '';
      const emailMatch =
        isValidEmail(emailA) &&
        isValidEmail(emailB) &&
        emailA.toLowerCase() === emailB.toLowerCase();

      const waA = normWhatsapp(enrollment.student_whatsapp);
      const waB = normWhatsapp(e.student_whatsapp);
      const waMatch = waA && waB && waA === waB;

      return emailMatch || waMatch;
    });

    // Always include the enrollment that was clicked, even if for some
    // reason the matching above didn't catch it (e.g. no email/whatsapp).
    if (!matches.some((e) => e.id === enrollment.id)) {
      matches.push(enrollment);
    }

    return matches;
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

  const startEdit = (enrollment) => {
    setEditingId(enrollment.id);
    setEditForm({
      student_name: enrollment.student_name || "",
      student_email: enrollment.student_email && enrollment.student_email.includes("@whatsapp.temp")
        ? ""
        : enrollment.student_email || "",
      student_whatsapp: enrollment.student_whatsapp || "",
      amount_paid: enrollment.amount_paid || "",
      course_name: enrollment.course_name || "",
      tutor_name: enrollment.tutor_name || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (enrollment) => {
    if (!editForm.student_email && !editForm.student_whatsapp) {
      alert("Please provide either an email or a WhatsApp number.");
      return;
    }

    setIsSavingEdit(true);

    try {
      // Same email-fallback convention used at enrollment creation time -
      // an enrollment always needs a non-empty student_email value, so a
      // WhatsApp-only contact gets a synthetic @whatsapp.temp address.
      const email = editForm.student_email
        ? editForm.student_email.toLowerCase().trim()
        : editForm.student_whatsapp
        ? `${editForm.student_whatsapp.replace(/\D/g, "")}@whatsapp.temp`
        : enrollment.student_email;

      await apiClient.entities.Enrollment.update(enrollment.id, {
        student_name: editForm.student_name.trim(),
        student_email: email,
        student_whatsapp: editForm.student_whatsapp.trim(),
        amount_paid: parseFloat(editForm.amount_paid) || 0,
        course_name: editForm.course_name.trim(),
        tutor_name: editForm.tutor_name.trim(),
      });

      cancelEdit();
      await loadEnrollments();
    } catch (error) {
      console.error("Error updating enrollment:", error);
      alert("Failed to update enrollment: " + error.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const startAddCourse = (enrollment) => {
    setAddCourseForId(enrollment.id);
    setAddCourseForm({ course_name: '', tutor_name: '', amount_paid: '' });
  };

  const cancelAddCourse = () => {
    setAddCourseForId(null);
    setAddCourseForm({ course_name: '', tutor_name: '', amount_paid: '' });
  };

  const handleAddCourse = async (enrollment) => {
    if (!addCourseForm.course_name.trim()) {
      alert('Please enter a course name.');
      return;
    }

    setIsAddingCourse(true);

    try {
      // Carries over the student's existing contact details so the new
      // course is recognized as belonging to the same student when
      // grouped for the admission card.
      await apiClient.entities.Enrollment.create({
        student_id: enrollment.student_id || undefined,
        student_name: enrollment.student_name || '',
        student_email: enrollment.student_email || '',
        student_whatsapp: enrollment.student_whatsapp || '',
        course_name: addCourseForm.course_name.trim(),
        tutor_name: addCourseForm.tutor_name.trim(),
        amount_paid: parseFloat(addCourseForm.amount_paid) || 0,
        status: 'active',
        enrollment_date: new Date().toISOString(),
      });

      cancelAddCourse();
      await loadEnrollments();
      alert('Course added.');
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course: ' + error.message);
    } finally {
      setIsAddingCourse(false);
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
        `Delete enrollment for ${student} (course: ${enrollment.course_name || 'unnamed'})? This cannot be undone.`
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
                {COURSE_DURATION_MONTHS} months. A student
                taking more than one course has one
                enrollment record per course - use "Add
                Course" on any of their cards to enroll them
                in another, and "Delete" on a card to drop
                that course. The Admission Card combines all
                of a student's active courses into one card.
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
            Review and manage student enrollment requests. Each card is one course; a student with several courses has one card per course.
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

                        {editingId === enrollment.id ? (
                          <div className="grid md:grid-cols-2 gap-3 mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Student Name
                              </label>
                              <Input
                                value={editForm.student_name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, student_name: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Email
                              </label>
                              <Input
                                type="email"
                                value={editForm.student_email}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, student_email: e.target.value })
                                }
                                placeholder="student@example.com"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                WhatsApp Number
                              </label>
                              <Input
                                type="tel"
                                value={editForm.student_whatsapp}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, student_whatsapp: e.target.value })
                                }
                                placeholder="+91 9876543210"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Fee (₹/month)
                              </label>
                              <Input
                                type="number"
                                value={editForm.amount_paid}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, amount_paid: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Course Name
                              </label>
                              <NeetJeeQuickSelect
                                onPick={(name) =>
                                  setEditForm({ ...editForm, course_name: name })
                                }
                              />
                              <Input
                                value={editForm.course_name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, course_name: e.target.value })
                                }
                                placeholder="e.g. Chemistry - Fundamentals"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Tutor Name
                              </label>
                              <Input
                                value={editForm.tutor_name}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, tutor_name: e.target.value })
                                }
                                placeholder="e.g. Karunanithi Rajamanickam"
                              />
                            </div>
                            <div className="md:col-span-2 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(enrollment)}
                                disabled={isSavingEdit}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Save className="w-4 h-4 mr-1" />
                                {isSavingEdit ? "Saving..." : "Save"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
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
                        )}

                        {addCourseForId === enrollment.id && (
                          <div className="grid md:grid-cols-3 gap-3 mb-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                New Course Name
                              </label>
                              <NeetJeeQuickSelect
                                onPick={(name) =>
                                  setAddCourseForm({ ...addCourseForm, course_name: name })
                                }
                              />
                              <Input
                                value={addCourseForm.course_name}
                                onChange={(e) =>
                                  setAddCourseForm({ ...addCourseForm, course_name: e.target.value })
                                }
                                placeholder="e.g. Physics - Boards Revision"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Tutor Name
                              </label>
                              <Input
                                value={addCourseForm.tutor_name}
                                onChange={(e) =>
                                  setAddCourseForm({ ...addCourseForm, tutor_name: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-700">
                                Fee (₹/month)
                              </label>
                              <Input
                                type="number"
                                value={addCourseForm.amount_paid}
                                onChange={(e) =>
                                  setAddCourseForm({ ...addCourseForm, amount_paid: e.target.value })
                                }
                              />
                            </div>
                            <div className="md:col-span-3 flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAddCourse(enrollment)}
                                disabled={isAddingCourse}
                                className="bg-emerald-600 hover:bg-emerald-700"
                              >
                                <PlusCircle className="w-4 h-4 mr-1" />
                                {isAddingCourse ? "Adding..." : "Add Course"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelAddCourse}>
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

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
                                setAdmissionEnrollments(
                                  getStudentEnrollments(enrollment, enrollments)
                                )
                              }
                              size="sm"
                              className="bg-[#1565C0] hover:bg-[#1e88e5]"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Admission Card
                            </Button>

                            <Button
                              onClick={() => startAddCourse(enrollment)}
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Add Course
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
                          onClick={() => startEdit(enrollment)}
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>

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
        enrollments={admissionEnrollments}
        open={Boolean(admissionEnrollments && admissionEnrollments.length)}
        onOpenChange={(open) => {
          if (!open) {
            setAdmissionEnrollments(null);
          }
        }}
      />

    </div>
  );
}
