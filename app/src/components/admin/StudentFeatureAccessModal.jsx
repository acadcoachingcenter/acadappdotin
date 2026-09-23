import React, { useEffect, useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { X, Sparkles, Loader2 } from 'lucide-react';

// Mirrors (for display only) the whole-word NEET/JEE matching the backend's
// real tutorAccess check - NOT the actual enforcement, just so admin can see
// at a glance whether a student currently qualifies without needing to hit
// a separate endpoint. NEET/JEE Smart-Tutor access itself is deliberately
// NOT editable from this modal - it stays on its own existing, secure,
// enrollment-based check.
const NEET_JEE_PATTERN = /\bNEET\b|\bJEE\b/i;

const FEATURES = [
  { key: 'smart_classroom', label: 'Open Smart Classroom' },
  { key: 'grademe', label: 'Start GradeMe' },
];

// studentEnrollments: the same array AdmissionCardModal receives - every
// active enrollment row belonging to one student (see getStudentEnrollments
// in AdminEnrollmentManagement.jsx). Feature access is a per-STUDENT
// setting, not per-course, so all of this modal's writes key off
// student_email rather than any single enrollment's id.
export default function StudentFeatureAccessModal({ studentEnrollments, open, onOpenChange }) {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  const student = (studentEnrollments && studentEnrollments[0]) || {};
  const studentEmail = student.student_email || '';
  const studentName = student.student_name || studentEmail || 'Student';
  const studentId = student.student_id || '';

  const isNeetJeeEligible = (studentEnrollments || []).some(
    (e) => e.status === 'active' && NEET_JEE_PATTERN.test(e.course_name || '')
  );

  useEffect(() => {
    if (!open || !studentEmail) return;

    let alive = true;
    setIsLoading(true);

    apiClient.entities.StudentFeatureAccess.filter({ student_email: studentEmail })
      .then((data) => {
        if (alive) setRows(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Error loading feature access:', error);
        if (alive) setRows([]);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [open, studentEmail]);

  if (!open) return null;

  const getRow = (featureKey) => rows.find((r) => r.feature_key === featureKey);

  const refresh = async () => {
    const refreshed = await apiClient.entities.StudentFeatureAccess.filter({
      student_email: studentEmail,
    });
    setRows(Array.isArray(refreshed) ? refreshed : []);
  };

  const handleToggle = async (featureKey, nextEnabled) => {
    setSavingKey(featureKey);
    try {
      const existing = getRow(featureKey);

      if (existing) {
        await apiClient.entities.StudentFeatureAccess.update(existing.id, {
          enabled: nextEnabled,
        });
      } else {
        await apiClient.entities.StudentFeatureAccess.create({
          student_email: studentEmail,
          student_id: studentId,
          student_name: studentName,
          feature_key: featureKey,
          enabled: nextEnabled,
        });
      }

      await refresh();
    } catch (error) {
      console.error('Error saving feature access:', error);
      alert('Failed to update feature access: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingKey(null);
    }
  };

  const handleClearOverride = async (featureKey) => {
    const existing = getRow(featureKey);
    if (!existing) return;

    setSavingKey(featureKey);
    try {
      await apiClient.entities.StudentFeatureAccess.delete(existing.id);
      await refresh();
    } catch (error) {
      console.error('Error clearing feature access override:', error);
      alert('Failed to clear override: ' + (error.message || 'Unknown error'));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Feature Access
            </h2>
            <p className="text-sm text-slate-600">{studentName}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-4">
            {FEATURES.map((feature) => {
              const row = getRow(feature.key);
              const isSaving = savingKey === feature.key;
              const hasOverride = Boolean(row);
              const effectiveEnabled = hasOverride ? !!row.enabled : null;

              return (
                <div key={feature.key} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{feature.label}</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleToggle(feature.key, true)}
                        className={
                          'rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 ' +
                          (effectiveEnabled === true
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-green-50')
                        }
                      >
                        On
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleToggle(feature.key, false)}
                        className={
                          'rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-50 ' +
                          (effectiveEnabled === false
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-red-50')
                        }
                      >
                        Off
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {hasOverride ? (
                      <>
                        Explicitly set by admin.{' '}
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleClearOverride(feature.key)}
                          className="underline hover:text-slate-700 disabled:opacity-50"
                        >
                          Clear override (use default)
                        </button>
                      </>
                    ) : (
                      'Not set - currently following the default (visible once this student has a confirmed enrollment).'
                    )}
                  </p>
                </div>
              );
            })}

            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
              <p className="font-medium text-slate-900">NEET | JEE Smart-Tutor</p>
              <p className="mt-1 text-xs text-slate-600">
                {isNeetJeeEligible
                  ? 'Eligible - this student has an active NEET/JEE-titled enrollment.'
                  : 'Not eligible - no active enrollment with "NEET" or "JEE" in the course name.'}
              </p>
              <p className="mt-1 text-xs text-violet-700">
                Not editable here - controlled automatically by enrollment (use "Add Course" / "Edit" with the NEET/JEE quick-select buttons).
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
