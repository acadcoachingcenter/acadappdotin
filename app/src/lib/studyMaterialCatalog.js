// Shared subject/chapter catalog for Study Materials (tutor + student pages).
//
// Two sources are merged:
//  1. SchoolBook's ingested-chapter registry (/api/grademe/available-chapters)
//     - fixed chapter lists, same IDs GradeMe uses.
//  2. ACAD's own day-to-day subjects (same list the Online Classroom
//     scheduler uses). These don't need anything ingested: the tutor picks a
//     grade and types the chapter name. This is what makes Hindi, Tamil,
//     Accountancy etc. available even though SchoolBook has no chapters for
//     them.
//
// Both kinds are stored in the same study_materials columns (grade, subject,
// chapter, chapter_title), so no schema change is involved.

export const ACAD_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Science",
  "English",
  "Tamil",
  "Hindi",
  "Computer Science",
  "Accountancy",
  "JEE Physics",
  "JEE Chemistry",
  "JEE Mathematics",
  "NEET Physics",
  "NEET Chemistry",
  "NEET Biology",
];

export const ACAD_GRADES = [6, 7, 8, 9, 10, 11, 12];

const CUSTOM_PREFIX = "custom:";

export function isCustomSubject(value) {
  return typeof value === "string" && value.startsWith(CUSTOM_PREFIX);
}

export function customSubjectName(value) {
  return isCustomSubject(value) ? value.slice(CUSTOM_PREFIX.length) : "";
}

export function gradeLabel(g) {
  return `Grade ${g}`;
}

// Stable chapter key for a typed chapter name, so two tutors typing
// "Chapter 3 - Poems" and "chapter 3 – poems" land on the same key.
export function customChapterId(title) {
  const slug = String(title || "")
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `custom-${slug || "chapter"}`;
}

// Registry subjects (one entry per subjectId, first-seen order) plus every
// ACAD subject as a "type the chapter" option.
export function buildSubjectOptions(availableChapters) {
  const registry = [];
  const seen = new Set();
  for (const c of availableChapters || []) {
    if (seen.has(c.subjectId)) continue;
    seen.add(c.subjectId);
    registry.push({
      value: c.subjectId,
      label: c.className ? `${c.className} — ${c.subjectName}` : c.subjectName,
      subjectName: c.subjectName,
      className: c.className || "",
    });
  }

  const custom = ACAD_SUBJECTS.map((name) => ({
    value: `${CUSTOM_PREFIX}${name}`,
    label: name,
    subjectName: name,
    className: "",
  }));

  return { registry, custom };
}
