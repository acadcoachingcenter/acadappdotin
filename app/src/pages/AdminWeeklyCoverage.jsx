import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Copy } from "lucide-react";
import { listAllClassLogs } from "@/lib/classroomApi";

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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    listAllClassLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const { start, end } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return weekRangeFor(base);
  }, [weekOffset]);

  const groups = useMemo(() => {
    const inRange = logs.filter((log) => {
      const logDate = new Date(`${log.log_date}T00:00:00${INDIA_OFFSET}`);
      return logDate >= start && logDate <= new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);
    });

    const byKey = {};
    for (const log of inRange) {
      const key = log.class_name || "Unspecified Class";
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(log);
    }

    Object.values(byKey).forEach((list) => list.sort((a, b) => a.log_date.localeCompare(b.log_date)));

    return Object.entries(byKey).sort(([a], [b]) => a.localeCompare(b));
  }, [logs, start, end]);

  const handleCopy = (key, entries) => {
    const text = entries
      .map(
        (log) =>
          `${log.log_date}${log.chapter ? ` (${log.chapter})` : ""} - ${log.tutor_name}: ${log.topics_covered}`
      )
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
          What tutors logged as covered, grouped by class — use this to set matching test
          questions each week.
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
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Next Week
          <ChevronRight size={16} />
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No logged coverage for this week. Tutors add entries from the Class Log section on
          their Online Classroom page — any date, so past weeks can be backfilled too.
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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-2">Date</th>
                    <th className="px-5 py-2">Chapter</th>
                    <th className="px-5 py-2">Topics Covered</th>
                    <th className="px-5 py-2">Tutor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-5 py-2.5 text-slate-700">{log.log_date}</td>
                      <td className="px-5 py-2.5 text-slate-600">{log.chapter || "—"}</td>
                      <td className="px-5 py-2.5 text-slate-800">{log.topics_covered}</td>
                      <td className="px-5 py-2.5 text-slate-500">{log.tutor_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
