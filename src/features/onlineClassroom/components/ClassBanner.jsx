import JoinMeetButton from "./JoinMeetButton";
import WhiteboardButton from "./WhiteboardButton";
import ResourceList from "./ResourceList";
import StatusPill from "./StatusPill";
import { classStatus } from "../../../lib/classroomApi";

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function ClassBanner({ classItem }) {
  const status = classStatus(classItem);

  return (
    <div className="overflow-hidden rounded-2xl border border-board/10 shadow-sm">
      <div className="bg-board bg-ruled px-6 py-5 text-chalk sm:px-8 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-chalk/60">
              {classItem.schedule.label}'s Class
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
              {classItem.subject}
            </h2>
            <p className="mt-1 text-sm text-chalk/80">
              {classItem.batchName} &middot; {classItem.tutorName}
            </p>
          </div>
          <StatusPill status={status} />
        </div>

        <p className="mt-4 font-mono text-sm text-chalk/70">
          {formatTime(classItem.schedule.startTime)} – {formatTime(classItem.schedule.endTime)}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <JoinMeetButton meetUrl={classItem.meetUrl} />
          <WhiteboardButton whiteboardUrl={classItem.whiteboardUrl} />
        </div>
      </div>

      <div className="bg-white px-6 py-5 sm:px-8">
        <h3 className="mb-2 text-sm font-semibold text-ink">Class Resources</h3>
        <ResourceList resources={classItem.resources} />
      </div>
    </div>
  );
}
