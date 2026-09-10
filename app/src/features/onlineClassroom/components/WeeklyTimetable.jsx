import { ExternalLink } from "lucide-react";
import { DAYS, TIME_SLOTS } from "../constants";

function formatSlotTime(time) {
  if (!time) return "";
  const [hour, minute] = time.split(":").map(Number);
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

// Reusable weekly grid: Monday-Friday down the rows, ACAD's three fixed
// time slots across the columns. Used unmodified on the Admin, Tutor, and
// Student Online Classroom pages - each just passes in whichever `classes`
// array it already has (all classes for admin, the signed-in user's own
// classes for tutor/student), so every role's timetable stays visually
// and behaviourally identical without any per-role logic living here.
//
// onClassClick is optional - the admin page passes its existing openEdit
// handler so clicking a class in the grid opens the same editor as
// clicking "Edit" in the list view. Tutor/Student pages omit it, so their
// grid is read-only (a class's own "Join" link still works either way).
export default function WeeklyTimetable({ classes, onClassClick }) {
  function classesFor(day, slot) {
    return classes.filter(
      (c) =>
        c.schedule?.day === day &&
        c.schedule?.startTime === slot.startTime &&
        c.schedule?.endTime === slot.endTime
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-32 border-b border-r border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Day
            </th>
            {TIME_SLOTS.map((slot) => (
              <th
                key={slot.id}
                className="border-b border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {slot.name}
                <div className="mt-0.5 text-[11px] font-normal normal-case text-slate-400">
                  {formatSlotTime(slot.startTime)} - {formatSlotTime(slot.endTime)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => (
            <tr key={day} className="align-top">
              <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900">
                {day}
              </td>
              {TIME_SLOTS.map((slot) => {
                const cellClasses = classesFor(day, slot);
                return (
                  <td key={slot.id} className="border-b border-slate-200 p-2 align-top">
                    {cellClasses.length === 0 ? (
                      <span className="block px-1 py-2 text-xs text-slate-300">—</span>
                    ) : (
                      <div className="space-y-1.5">
                        {cellClasses.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => onClassClick?.(c)}
                            className={`rounded-lg border border-slate-200 bg-slate-50 p-2 ${
                              onClassClick
                                ? "cursor-pointer hover:border-slate-400 hover:bg-slate-100"
                                : ""
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-900">
                              {c.subject}
                              <span className="font-normal text-slate-500"> · Grade {c.grade}</span>
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">{c.batchName}</p>
                            {c.tutorName && (
                              <p className="mt-0.5 text-[11px] text-slate-400">{c.tutorName}</p>
                            )}
                            {c.meetUrl && (
                              <a
                                href={c.meetUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                              >
                                <ExternalLink size={11} />
                                Join
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
