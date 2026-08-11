import { Video } from "lucide-react";

export default function JoinMeetButton({ meetUrl, size = "lg" }) {
  const disabled = !meetUrl;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
  const sizing = size === "lg" ? "px-5 py-3 text-base" : "px-3.5 py-2 text-sm";

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`${base} ${sizing} cursor-not-allowed bg-chalkline text-slate`}
        title="Tutor hasn't set a Meet link for this class yet"
      >
        <Video size={size === "lg" ? 18 : 16} />
        No link set yet
      </button>
    );
  }

  return (
    <a
      href={meetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${sizing} bg-accent text-boarddark hover:bg-accentdark`}
    >
      <Video size={size === "lg" ? 18 : 16} />
      Join Live Class
    </a>
  );
}
