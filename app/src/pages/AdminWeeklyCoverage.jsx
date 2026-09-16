import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Copy } from "lucide-react";
import { listClassesForUser } from "@/lib/classroomApi";
import { useAuth } from "@/lib/AuthContext";

const INDIA_OFFSET = "+05:30";

// Monday-start week containing `date`, in IST.
function weekRangeFor(date) {
  const d = new Date(date);
  const istDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
  const istDate = new Date(`${istDateStr}T00:00:00${INDIA_OFFSET}`);
  const dayOfWeek = istDate.getDay(); // 0 = Sunday
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(istDate);
  monday.setDate(monday.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return { start: monday, end: sunday };
}

function formatDateRange(start, end) {
  const opts = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-IN", opts)} – ${end.toLocaleDateString("en-IN", { ...opts, year: "numeric" })}`;
}

export default function AdminWeeklyCoverage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!user) return;
    listClassesForUser(user)
      .then(setClasses)
      .finally(() => setLoading(false));
  }, [user]);

  const { start, end } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return weekRangeFor(base);
  }, [weekOffset]);

  const groups = useMemo(() => {
    const inRange = classes.filter((c) => {
      if (!c.coveredPortions) return false;
      const classDate = new Date(c.schedule?.date || "");
      return classDate >= start && classDate <= new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);
    });

    const byKey = {};
    for (const c of inRange) {
      const key = `Grade ${c.grade} - ${c.subject}`;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(c);
    }

    Object.values(byKey).forEach((list) =>
      list.sort((a, b) => (a.schedule?.date || "").localeCompare(b.schedule?.date || ""))
    );

    return Object.entries(byKey).sort(([a], [b]) => a.localeCompare(b));
  }, [classes, start, end]);

  const handleCopy = (key, entries) => {
    const text = entries
      .map((c) => `${c.schedule?.date} (${c.batchName}, ${c.tutorName}): ${c.coveredPortions}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (loading) return <p className="p-6 text-slate-600">Loading coverage data…</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Weekly Coverage Report</h1>
        <p className="mt-1 text-slate-600">
          What tutors logged as covered, grouped by grade and subject — use this to set matching
          test questions each week.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          <ChevronLeft size={16} />
          Previous Week
        </button>
        <span className="font-semibold text-slate-900">{formatDateRange(start, end)}</span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          disabled={weekOffset >= 0}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
        >
          Next Week
          <ChevronRight size={16} />
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No logged coverage for this week yet. Tutors log this from their Online Classroom page
          after each class.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([key, entries]) => (
            <div key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3">
                <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                  <BookOpen size={16} className="text-blue-600" />
                  {key}
                </h2>
                <button
                  onClick={() => handleCopy(key, entries)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium hover:bg-slate-100"
                >
                  <Copy size={12} />
                  {copiedKey === key ? "Copied!" : "Copy all"}
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {entries.map((c) => (
                  <div key={c.id} className="px-5 py-3">
                    <p className="text-xs text-slate-500">
                      {c.schedule?.date} · {c.batchName} · {c.tutorName}
                    </p>
                    <p className="mt-1 text-sm text-slate-800">{c.coveredPortions}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
