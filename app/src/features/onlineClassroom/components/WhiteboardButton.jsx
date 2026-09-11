import { useState } from "react";
import { PenLine } from "lucide-react";
import ClassroomWhiteboard from "./ClassroomWhiteboard";

function parseStatus(classItem) {
  try {
    const parsed = JSON.parse(classItem?.whiteboard_data || "");
    return parsed?.status || null;
  } catch {
    return null;
  }
}

// role: "tutor" | "student" | "admin"
export default function WhiteboardButton({ classItem, role, size = "lg", onMetaChange }) {
  const [open, setOpen] = useState(false);
  const status = parseStatus(classItem);
  const sizing = size === "lg" ? "px-5 py-3 text-base" : "px-3.5 py-2 text-sm";

  const isEditor = role === "tutor";
  const viewerCanJoin = !isEditor && status === "active";
  const disabled = !isEditor && status !== "active";

  let label = "Open Whiteboard";
  if (isEditor) label = status === "active" ? "Resume Whiteboard" : "Start Whiteboard";
  else if (viewerCanJoin) label = "View Whiteboard";
  else label = "Whiteboard not started";

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 ${sizing}`}
      >
        <PenLine size={size === "lg" ? 18 : 16} />
        {label}
      </button>

      {open && (
        <ClassroomWhiteboard
          classItem={classItem}
          role={role}
          onClose={() => setOpen(false)}
          onMetaChange={onMetaChange}
        />
      )}
    </>
  );
}
