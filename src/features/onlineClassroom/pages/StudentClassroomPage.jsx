
import { useEffect, useState } from "react";
import { ExternalLink, CalendarDays } from "lucide-react";
import { classStatus, formatClassTime, listClassesForUser } from "../../../lib/classroomApi";

export default function StudentClassroomPage({ user }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClassesForUser(user).then(setClasses).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p className="text-slate">Loading your classes…</p>;

  if (!classes.length) {
    return (
      <div className="rounded-xl border border-dashed border-chalkline bg-white p-8 text-center">
        <p className="font-display text-lg text-ink">No classes assigned yet</p>
        <p className="mt-1 text-sm text-slate">
          Your ACAD account will automatically show classes assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((c) => {
        const status = classStatus(c);
        return (
          <div key={c.id} className="rounded-xl border border-chalkline bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-ink">
                    Grade {c.grade} · {c.subject}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate">
                    {status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate">{c.batchName} · {c.schedule.day}</p>
                <p className="mt-1 text-sm font-medium text-ink">
                  <CalendarDays size={14} className="mr-1 inline" />
                  {c.schedule.date} · {formatClassTime(c)}
                </p>
                <p className="mt-1 text-sm text-slate">Tutor: {c.tutorName}</p>
              </div>

              <a
                href={c.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white"
              >
                <ExternalLink size={16} />
                Join Google Meet
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
