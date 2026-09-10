// Shared time-slot / day-of-week constants for ACAD's Online Classroom
// scheduling and timetable views. Kept here (rather than duplicated in
// each page) so the admin scheduler and the read-only weekly timetable
// (used on the Admin, Tutor, and Student pages) always agree - change a
// slot's time here and every page that displays it updates together.

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const TIME_SLOTS = [
  { id: "morning", name: "Morning", startTime: "06:00", endTime: "07:00" },
  { id: "evening-a", name: "Evening A", startTime: "18:00", endTime: "19:00" },
  { id: "evening-b", name: "Evening B", startTime: "19:00", endTime: "20:00" },
];
