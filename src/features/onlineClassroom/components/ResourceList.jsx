import { FileText, Image as ImageIcon, File } from "lucide-react";

const ICONS = {
  pdf: FileText,
  image: ImageIcon,
  doc: File,
};

export default function ResourceList({ resources }) {
  if (!resources || resources.length === 0) {
    return (
      <p className="text-sm text-slate">
        No resources uploaded for this class yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {resources.map((r) => {
        const Icon = ICONS[r.type] || File;
        return (
          <a
            key={r.id}
            href={r.url}
            className="inline-flex items-center gap-2 rounded-md border border-chalkline bg-white px-3 py-2 text-sm text-ink transition-colors hover:border-accent/60 hover:bg-chalk"
          >
            <Icon size={16} className="text-slate" />
            {r.title}
          </a>
        );
      })}
    </div>
  );
}
