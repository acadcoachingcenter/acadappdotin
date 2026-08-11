import { useState } from "react";
import { Users } from "lucide-react";
import JoinMeetButton from "./JoinMeetButton";
import WhiteboardButton from "./WhiteboardButton";
import ResourceList from "./ResourceList";
import MeetLinkForm from "./MeetLinkForm";
import StatusPill from "./StatusPill";
import { classStatus } from "../../../lib/classroomApi";

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function ClassCard({ classItem, canEditMeetUrl, showTutorName }) {
  const [item, setItem] = useState(classItem);
  const status = classStatus(item);

  return (
    <div className="rounded-xl border border-chalkline bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-slate">
            {item.schedule.label} &middot; {formatTime(item.schedule.startTime)}–
            {formatTime(item.schedule.endTime)}
          </p>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-ink">
            {item.subject}
          </h3>
          <p className="text-sm text-slate">
            {item.batchName}
            {showTutorName && <> &middot; {item.tutorName}</>}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate">
        <Users size={13} />
        {item.studentIds.length} student{item.studentIds.length !== 1 ? "s" : ""} assigned
      </div>

      {canEditMeetUrl && (
        <div className="mt-4 border-t border-chalkline pt-4">
          <MeetLinkForm classItem={item} onUpdated={setItem} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <JoinMeetButton meetUrl={item.meetUrl} size="sm" />
        <WhiteboardButton whiteboardUrl={item.whiteboardUrl} size="sm" />
      </div>

      <div className="mt-4 border-t border-chalkline pt-4">
        <ResourceList resources={item.resources} />
      </div>
    </div>
  );
}
