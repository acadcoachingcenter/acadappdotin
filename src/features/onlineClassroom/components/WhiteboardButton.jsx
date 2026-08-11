import { PenLine } from "lucide-react";

export default function WhiteboardButton({ whiteboardUrl, size = "lg" }) {
  const sizing = size === "lg" ? "px-5 py-3 text-base" : "px-3.5 py-2 text-sm";

  return (
    <a
      href={whiteboardUrl || "https://excalidraw.com"}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-board/20 bg-white font-semibold text-ink transition-colors hover:border-board/40 hover:bg-chalk ${sizing}`}
    >
      <PenLine size={size === "lg" ? 18 : 16} />
      Open Whiteboard
    </a>
  );
}
