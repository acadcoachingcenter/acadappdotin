import { useEffect, useState } from "react";
import { ExternalLink, CalendarDays } from "lucide-react";
import { classStatus, formatClassTime, listClassesForUser } from "../../../lib/classroomApi";

export default function TutorClassroomPage({ user }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClassesForUser(user).then(setClasses).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <p className="text-slate">Loading your classes…</p>;

  return (
    <div className="space-y-4">
      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-chalkline bg-white p-8 text-center text-slate">
          No classes have been assigned to you yet.
        </div>
      ) : (
        classes.map((c) => {
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

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                The Google Meet link is fixed for this ACAD class. The admin/host starts the meeting;
                please join using the same link when the class begins.
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
