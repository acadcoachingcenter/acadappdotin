export default function StatusPill({ status }) {
  const map = {
    "live-soon": {
      label: "Today",
      dot: "bg-live",
      text: "text-live",
      ring: "ring-live/30",
    },
    upcoming: {
      label: "Upcoming",
      dot: "bg-slate",
      text: "text-slate",
      ring: "ring-slate/20",
    },
  };
  const s = map[status] || map.upcoming;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium ring-1 ${s.ring} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
