import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  IndianRupee,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  Users,
  Calendar,
} from 'lucide-react';

// How many days before the due date a payment starts showing up in this panel.
const ADVANCE_NOTICE_DAYS = 3;

// The reminder message pre-filled into the WhatsApp link. Admin reviews and
// sends it themselves -- nothing is sent automatically.
const REMINDER_MESSAGE = ({ studentName, courseName, amount, dueDateLabel }) =>
  `Dear Parent,\n\nThis is a gentle reminder that the monthly fee of Rs.${amount} for ${studentName}'s course "${courseName}" is due on ${dueDateLabel}.\n\nKindly complete the payment at your earliest convenience to ensure uninterrupted, smooth continuation of your child's classes.\n\nThank you,\nACAD Coaching Center\nacadcoachingcenter@gmail.com | +91-9790818436`;

function formatDate(d) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function periodKey(year, month /* 0-indexed */) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// Returns the due date for a given (year, month), clamped to the last day
// of that month if the enrollment day doesn't exist in it (e.g. enrolled on
// the 31st -> due on the 30th/28th/29th in shorter months).
function dueDateFor(enrollmentDay, year, month) {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(enrollmentDay, lastDayOfMonth);
  return new Date(year, month, day);
}

// Walks forward one billing period at a time from the month after
// enrollment, up to and including a few days past today, and returns every
// (period_month, due_date) pair that doesn't have a matching FeePayment row.
// The first month's fee is assumed already covered by the Enrollment record
// itself (collected at signup), so tracking starts from month 2.
function computeUnpaidPeriods(enrollment, paidPeriodKeys, today, advanceDays) {
  const enrollDate = new Date(enrollment.enrollment_date || enrollment.created_date);
  if (isNaN(enrollDate)) return [];

  const enrollmentDay = enrollDate.getDate();
  const windowEnd = new Date(today);
  windowEnd.setDate(windowEnd.getDate() + advanceDays);

  let year = enrollDate.getFullYear();
  let month = enrollDate.getMonth() + 1; // start one month after enrollment

  const unpaid = [];
  // Safety cap so a data glitch can't spin this into an infinite loop.
  for (let i = 0; i < 240; i++) {
    if (month > 11) { month = 0; year += 1; }

    const due = dueDateFor(enrollmentDay, year, month);
    if (due > windowEnd) break;

    const key = periodKey(year, month);
    if (!paidPeriodKeys.has(`${enrollment.id}:${key}`)) {
      unpaid.push({ periodMonth: key, dueDate: due });
    }

    month += 1;
  }

  return unpaid;
}

export default function AdminFeesDue() {
  const [enrollments, setEnrollments] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingKey, setMarkingKey] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [enrollResult, paymentResult] = await Promise.all([
        apiClient.entities.Enrollment.list('-created_date'),
        apiClient.entities.FeePayment.list('-created_date'),
      ]);

      setEnrollments(Array.isArray(enrollResult) ? enrollResult : []);
      setFeePayments(Array.isArray(paymentResult) ? paymentResult : []);
    } catch (error) {
      console.error('Error loading fees due data:', error);
      setEnrollments([]);
      setFeePayments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const dueItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paidPeriodKeys = new Set(
      feePayments.map((p) => `${p.enrollment_id}:${p.period_month}`)
    );

    const items = [];

    enrollments
      .filter((e) => e.status === 'active')
      .forEach((enrollment) => {
        const unpaidPeriods = computeUnpaidPeriods(
          enrollment,
          paidPeriodKeys,
          today,
          ADVANCE_NOTICE_DAYS
        );

        if (unpaidPeriods.length === 0) return;

        // Show the oldest unpaid period as the actionable item; surface how
        // many additional months are also outstanding, if any.
        const [earliest, ...rest] = unpaidPeriods;
        const isOverdue = earliest.dueDate < today;
        const daysDiff = Math.round((earliest.dueDate - today) / (1000 * 60 * 60 * 24));

        items.push({
          enrollment,
          periodMonth: earliest.periodMonth,
          dueDate: earliest.dueDate,
          isOverdue,
          daysDiff,
          additionalMonthsOwed: rest.length,
        });
      });

    // Overdue first (most overdue first), then soonest-upcoming.
    items.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      return a.dueDate - b.dueDate;
    });

    return items;
  }, [enrollments, feePayments]);

  const handleMarkPaid = async (item) => {
    const { enrollment, periodMonth, dueDate } = item;

    const student = enrollment.student_name || enrollment.student_email || 'student';
    if (
      !window.confirm(
        `Mark ${student}'s fee for ${periodMonth} (${enrollment.course_name || 'course'}) as paid?`
      )
    ) {
      return;
    }

    const transactionId = window.prompt('Transaction ID (optional):', '') || '';

    setMarkingKey(`${enrollment.id}:${periodMonth}`);
    try {
      await apiClient.entities.FeePayment.create({
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id || '',
        student_name: enrollment.student_name || '',
        student_email: enrollment.student_email || '',
        student_whatsapp: enrollment.student_whatsapp || '',
        course_id: enrollment.course_id || '',
        course_name: enrollment.course_name || '',
        tutor_name: enrollment.tutor_name || '',
        period_month: periodMonth,
        due_date: dueDate.toISOString(),
        amount_paid: Number(enrollment.amount_paid || 0),
        payment_transaction_id: transactionId,
        paid_date: new Date().toISOString(),
        notes: '',
      });

      await loadData();
    } catch (error) {
      console.error('Error marking fee as paid:', error);
      alert('Failed to mark as paid: ' + error.message);
    } finally {
      setMarkingKey(null);
    }
  };

  const getWhatsAppLink = (item) => {
    const { enrollment, dueDate } = item;
    const phone = (enrollment.student_whatsapp || '').replace(/\D/g, '');
    if (!phone) return null;

    const message = REMINDER_MESSAGE({
      studentName: enrollment.student_name || 'your child',
      courseName: enrollment.course_name || 'their course',
      amount: Number(enrollment.amount_paid || 0).toLocaleString('en-IN'),
      dueDateLabel: formatDate(dueDate),
    });

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const totalOverdue = dueItems.filter((i) => i.isOverdue).length;
  const totalUpcoming = dueItems.length - totalOverdue;
  const totalAmountDue = dueItems.reduce(
    (sum, i) => sum + Number(i.enrollment.amount_paid || 0),
    0
  );

  if (isLoading) {
    return <div className="p-6">Loading fees due...</div>;
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Fees Due</h1>
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <IndianRupee className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">How this works</p>
              <p>
                Each active student's due date is their original enrollment day, repeating monthly.
                Items appear here starting {ADVANCE_NOTICE_DAYS} days before they're due, and stay
                listed (marked overdue) until you click "Mark Paid". The first month's fee is
                assumed already collected at enrollment - this only tracks month 2 onward.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{totalOverdue}</div>
              <div className="text-sm text-slate-600">Overdue</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{totalUpcoming}</div>
              <div className="text-sm text-slate-600">Due Soon</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                ₹{totalAmountDue.toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-slate-600">Total Amount Due</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students with fees due</CardTitle>
          <p className="text-sm text-slate-600">
            Sorted by most overdue first, then soonest upcoming.
          </p>
        </CardHeader>

        <CardContent>
          {dueItems.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-300 mb-4" />
              <p className="text-slate-600">All caught up - no fees due right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dueItems.map((item) => {
                const key = `${item.enrollment.id}:${item.periodMonth}`;
                const waLink = getWhatsAppLink(item);

                return (
                  <div
                    key={key}
                    className={`border rounded-lg p-4 ${
                      item.isOverdue ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {item.enrollment.student_name || 'Unknown Student'}
                          </h3>

                          {item.isOverdue ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Overdue by {Math.abs(item.daysDiff)}d
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Due in {item.daysDiff}d
                            </Badge>
                          )}

                          {item.additionalMonthsOwed > 0 && (
                            <Badge variant="outline" className="text-red-700 border-red-300">
                              +{item.additionalMonthsOwed} more month{item.additionalMonthsOwed > 1 ? 's' : ''} owed
                            </Badge>
                          )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm text-slate-600">
                          <p className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <strong>Course:</strong> {item.enrollment.course_name || '-'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <strong>Due:</strong> {formatDate(item.dueDate)} ({item.periodMonth})
                          </p>
                          <p className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-slate-400" />
                            <strong>Amount:</strong> ₹{Number(item.enrollment.amount_paid || 0).toLocaleString('en-IN')}
                          </p>
                          <p>
                            <strong>Tutor:</strong> {item.enrollment.tutor_name || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleMarkPaid(item)}
                          disabled={markingKey === key}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          {markingKey === key ? 'Saving...' : 'Mark Paid'}
                        </Button>

                        {waLink && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-300 hover:bg-green-50"
                          >
                            <a href={waLink} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Send Reminder
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
