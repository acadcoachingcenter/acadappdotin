// ACAD timetable → PNG renderer.
// Pure Canvas 2D, no dependencies. Draws a Day × Slot grid (Mon–Sun) and
// shows the session focus (Core Concepts / Numerical Problems / Doubt Session)
// instead of tutor names.

export const SESSION_FOCUS = [
  { id: "core", label: "Core Concepts", bg: "#DBEAFE", fg: "#1E3A8A", bar: "#2563EB" },
  { id: "numerical", label: "Numerical Problems", bg: "#FEF3C7", fg: "#78350F", bar: "#D97706" },
  { id: "doubt", label: "Doubt Session", bg: "#DCFCE7", fg: "#14532D", bar: "#16A34A" },
];

export function focusById(id) {
  return SESSION_FOCUS.find((f) => f.id === id) || SESSION_FOCUS[0];
}

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const FONT = `"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const C = {
  ink: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  head: "#1E293B",
  headText: "#FFFFFF",
  headSub: "#CBD5E1",
  dayBg: "#F1F5F9",
  weekendBg: "#F8FAFC",
  page: "#FFFFFF",
  brand: "#1D4ED8",
};

// Layout (logical px; canvas is rendered at SCALE× for sharpness)
const SCALE = 2;
const W = 1600;
const PAD = 40;
const DAY_COL = 170;
const CELL_PAD = 10;
const CARD_GAP = 8;
const CARD_PAD = 12;
const TITLE_LH = 21;
const PILL_H = 24;
const MIN_ROW = 70;

function to12h(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function wrap(ctx, text, maxW) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (!line || ctx.measureText(test).width <= maxW) line = test;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * entries: [{ day, startTime, endTime, subject, grade, focus }]
 * timeSlots: [{ id, name, startTime, endTime }]
 * Returns grid[dayIndex][colIndex] = entries[], last column = "Other Times".
 * Identical classes (same day/time/subject/grade/focus) are merged, so a
 * 12-week repeat series appears once.
 */
function buildGrid(entries, timeSlots, WEEK) {
  const cols = timeSlots.length + 1;
  const grid = WEEK.map(() => Array.from({ length: cols }, () => []));
  const seen = new Set();

  for (const e of entries) {
    const d = WEEK.indexOf(e.day);
    if (d < 0) continue;
    const key = [e.day, e.startTime, e.endTime, e.subject, e.grade, e.focus].join("|");
    if (seen.has(key)) continue;
    seen.add(key);

    let col = timeSlots.findIndex((s) => s.startTime === e.startTime && s.endTime === e.endTime);
    const isOther = col < 0;
    if (isOther) col = timeSlots.length;
    grid[d][col].push({ ...e, isOther });
  }

  for (const row of grid)
    for (const cell of row)
      cell.sort(
        (a, b) =>
          String(a.startTime).localeCompare(String(b.startTime)) ||
          String(a.subject).localeCompare(String(b.subject))
      );
  return grid;
}

function cardTitle(e) {
  return `${e.subject}${e.grade ? ` · Grade ${e.grade}` : ""}`;
}

function measureCard(ctx, e, innerW) {
  ctx.font = `700 16px ${FONT}`;
  const lines = wrap(ctx, cardTitle(e), innerW - CARD_PAD * 2 - 6);
  const timeH = e.isOther ? 19 : 0;
  const h = CARD_PAD + timeH + lines.length * TITLE_LH + 8 + PILL_H + CARD_PAD;
  return { lines, h };
}

function drawPill(ctx, x, y, focus) {
  ctx.font = `700 13px ${FONT}`;
  const w = ctx.measureText(focus.label).width + 20;
  ctx.fillStyle = focus.bg;
  roundRect(ctx, x, y, w, PILL_H, PILL_H / 2);
  ctx.fill();
  ctx.fillStyle = focus.fg;
  ctx.textBaseline = "middle";
  ctx.fillText(focus.label, x + 10, y + PILL_H / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return w;
}

export async function renderTimetablePng(
  entries,
  {
    timeSlots,
    days = DEFAULT_DAYS,
    title = "ACAD Online Coaching",
    subtitle = "Live Class Timetable",
    footer = "acadapp.in",
  } = {}
) {
  const WEEK = days;
  if (document.fonts?.ready) await document.fonts.ready;

  const grid = buildGrid(entries, timeSlots, WEEK);
  const colCount = timeSlots.length + 1;
  const colW = (W - PAD * 2 - DAY_COL) / colCount;
  const cardW = colW - CELL_PAD * 2;

  // Pass 1: measure
  const measure = document.createElement("canvas").getContext("2d");
  const layout = grid.map((row) => {
    const cells = row.map((cell) => cell.map((e) => ({ e, ...measureCard(measure, e, cardW) })));
    const content = Math.max(
      0,
      ...cells.map((cards) =>
        cards.length ? cards.reduce((s, c) => s + c.h, 0) + CARD_GAP * (cards.length - 1) + CELL_PAD * 2 : 0
      )
    );
    return { cells, h: Math.max(MIN_ROW, content) };
  });

  const HEADER_H = 120;
  const TABLE_HEAD_H = 68;
  const LEGEND_H = 90;
  const tableH = TABLE_HEAD_H + layout.reduce((s, r) => s + r.h, 0);
  const H = PAD + HEADER_H + tableH + LEGEND_H + PAD;

  // Pass 2: draw
  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = C.brand;
  ctx.fillRect(PAD, PAD, 6, 64);
  ctx.fillStyle = C.ink;
  ctx.font = `800 34px ${FONT}`;
  ctx.fillText(title, PAD + 22, PAD + 34);
  ctx.fillStyle = C.muted;
  ctx.font = `500 19px ${FONT}`;
  ctx.fillText(subtitle, PAD + 22, PAD + 64);
  ctx.textAlign = "right";
  ctx.font = `600 15px ${FONT}`;
  ctx.fillText("All times in IST", W - PAD, PAD + 34);
  ctx.textAlign = "left";

  const tableX = PAD;
  const tableY = PAD + HEADER_H;
  const tableW = W - PAD * 2;

  // Table frame
  ctx.save();
  roundRect(ctx, tableX, tableY, tableW, tableH, 14);
  ctx.clip();

  // Column header
  ctx.fillStyle = C.head;
  ctx.fillRect(tableX, tableY, tableW, TABLE_HEAD_H);
  const headCols = [
    ...timeSlots.map((s) => ({ name: s.name, sub: `${to12h(s.startTime)} – ${to12h(s.endTime)}` })),
    { name: "Other Times", sub: "Custom-scheduled classes" },
  ];
  ctx.fillStyle = C.headText;
  ctx.font = `700 17px ${FONT}`;
  ctx.fillText("Day", tableX + 18, tableY + 40);
  headCols.forEach((col, i) => {
    const x = tableX + DAY_COL + i * colW + CELL_PAD + 4;
    ctx.fillStyle = C.headText;
    ctx.font = `700 17px ${FONT}`;
    ctx.fillText(col.name, x, tableY + 30);
    ctx.fillStyle = C.headSub;
    ctx.font = `500 13px ${FONT}`;
    ctx.fillText(col.sub, x, tableY + 51);
  });

  // Rows
  let y = tableY + TABLE_HEAD_H;
  layout.forEach((row, d) => {
    const weekend = WEEK[d] === "Saturday" || WEEK[d] === "Sunday";
    ctx.fillStyle = weekend ? C.weekendBg : C.page;
    ctx.fillRect(tableX, y, tableW, row.h);
    ctx.fillStyle = C.dayBg;
    ctx.fillRect(tableX, y, DAY_COL, row.h);

    ctx.fillStyle = weekend ? C.muted : C.ink;
    ctx.font = `700 17px ${FONT}`;
    ctx.fillText(WEEK[d], tableX + 18, y + 38);

    row.cells.forEach((cards, ci) => {
      const cx = tableX + DAY_COL + ci * colW + CELL_PAD;
      if (!cards.length) {
        ctx.fillStyle = "#CBD5E1";
        ctx.font = `500 18px ${FONT}`;
        ctx.textAlign = "center";
        ctx.fillText("—", tableX + DAY_COL + ci * colW + colW / 2, y + 42);
        ctx.textAlign = "left";
        return;
      }
      let cy = y + CELL_PAD;
      for (const { e, lines, h } of cards) {
        const focus = focusById(e.focus);
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, h, 10);
        ctx.fill();
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = focus.bar;
        roundRect(ctx, cx, cy, 5, h, 3);
        ctx.fill();

        let ty = cy + CARD_PAD;
        if (e.isOther) {
          ctx.fillStyle = C.muted;
          ctx.font = `600 13px ${FONT}`;
          ctx.fillText(`${to12h(e.startTime)} – ${to12h(e.endTime)}`, cx + CARD_PAD + 6, ty + 13);
          ty += 19;
        }
        ctx.fillStyle = C.ink;
        ctx.font = `700 16px ${FONT}`;
        lines.forEach((ln, i) => ctx.fillText(ln, cx + CARD_PAD + 6, ty + 16 + i * TITLE_LH));
        ty += lines.length * TITLE_LH + 8;
        drawPill(ctx, cx + CARD_PAD + 6, ty, focus);
        cy += h + CARD_GAP;
      }
    });

    // row divider
    ctx.fillStyle = C.line;
    ctx.fillRect(tableX, y + row.h - 1, tableW, 1);
    y += row.h;
  });

  // column dividers
  ctx.fillStyle = C.line;
  for (let i = 0; i <= colCount; i++) {
    const x = tableX + DAY_COL + i * colW;
    ctx.fillRect(x, tableY + TABLE_HEAD_H, 1, tableH - TABLE_HEAD_H);
  }
  ctx.restore();

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  roundRect(ctx, tableX + 0.5, tableY + 0.5, tableW - 1, tableH - 1, 14);
  ctx.stroke();

  // Legend + footer
  const ly = tableY + tableH + 34;
  let lx = PAD;
  ctx.fillStyle = C.muted;
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText("Session focus", lx, ly + 17);
  lx += ctx.measureText("Session focus").width + 16;
  for (const f of SESSION_FOCUS) lx += drawPill(ctx, lx, ly, f) + 10;

  ctx.textAlign = "right";
  ctx.fillStyle = C.muted;
  ctx.font = `500 14px ${FONT}`;
  const stamp = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  ctx.fillText(`${footer}  |  Generated ${stamp}`, W - PAD, ly + 17);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not create PNG."))), "image/png")
  );
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
