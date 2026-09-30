// ACAD timetable → PNG renderer.
// Pure Canvas 2D, no dependencies. Draws a Day × Slot grid and shows the
// session focus (Core Concepts / Numerical Problems / Doubt Session)
// instead of tutor names. Slot columns with no classes (e.g. an unused
// Morning batch) are dropped so the remaining columns get wider text.

export const SESSION_FOCUS = [
  { id: "core", label: "Core Concepts", bg: "#DBEAFE", fg: "#1E3A8A", bar: "#2563EB" },
  { id: "numerical", label: "Numerical Problems", bg: "#FEF3C7", fg: "#78350F", bar: "#D97706" },
  { id: "doubt", label: "Doubt Session", bg: "#DCFCE7", fg: "#14532D", bar: "#16A34A" },
];

export function focusById(id) {
  return SESSION_FOCUS.find((f) => f.id === id) || SESSION_FOCUS[0];
}

const DEFAULT_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_LOGO = "/images/acad-logo.jpeg";

const FONT = `"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
const C = {
  ink: "#0F172A",
  muted: "#475569",
  faint: "#CBD5E1",
  line: "#E2E8F0",
  head: "#1E293B",
  headText: "#FFFFFF",
  headSub: "#CBD5E1",
  dayBg: "#F1F5F9",
  weekendBg: "#F8FAFC",
  page: "#FFFFFF",
};

// Layout in logical px; the canvas is rendered at SCALE× for sharpness.
// Sizes are tuned so text stays readable when the image is viewed on a
// phone in WhatsApp (≈ 1/3 scale).
const SCALE = 2;
const W = 1400;
const PAD = 36;
const DAY_COL = 190;
const CELL_PAD = 10;
const CARD_GAP = 10;
const CARD_PAD = 14;
const BAR_W = 6;

const T = {
  title: 40,
  subtitle: 23,
  note: 19,
  headName: 24,
  headSub: 18,
  day: 24,
  cardTime: 18,
  cardTitle: 23,
  cardTitleLH: 30,
  pill: 18,
  pillH: 34,
  legend: 19,
};

const LOGO_SIZE = 104;
const HEADER_H = 140;
const TABLE_HEAD_H = 86;
const MIN_ROW = 84;
const LEGEND_H = 100;

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

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src || typeof Image === "undefined") return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // logo is optional - never block the PNG
    img.src = src;
  });
}

// Grid columns: every preset slot that has at least one class, then
// "Other Times" if any class is outside the presets. Empty columns are
// dropped. Identical classes (same day/time/subject/grade/focus) merge,
// so a 12-week repeat series appears once.
function buildGrid(entries, timeSlots, days) {
  const seen = new Set();
  const unique = [];
  for (const e of entries) {
    if (!days.includes(e.day)) continue;
    const key = [e.day, e.startTime, e.endTime, e.subject, e.grade, e.focus].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    const slotIdx = timeSlots.findIndex((s) => s.startTime === e.startTime && s.endTime === e.endTime);
    unique.push({ ...e, slotIdx, isOther: slotIdx < 0 });
  }

  const columns = timeSlots
    .map((s, i) => ({
      name: s.name,
      sub: `${to12h(s.startTime)} – ${to12h(s.endTime)}`,
      match: (e) => e.slotIdx === i,
    }))
    .filter((col) => unique.some(col.match));

  if (unique.some((e) => e.isOther)) {
    columns.push({ name: "Other Times", sub: "Custom-scheduled classes", match: (e) => e.isOther });
  }

  const grid = days.map((day) =>
    columns.map((col) =>
      unique
        .filter((e) => e.day === day && col.match(e))
        .sort(
          (a, b) =>
            String(a.startTime).localeCompare(String(b.startTime)) ||
            String(a.subject).localeCompare(String(b.subject))
        )
    )
  );

  return { columns, grid };
}

function cardTitle(e) {
  return `${e.subject}${e.grade ? ` · Grade ${e.grade}` : ""}`;
}

function measureCard(ctx, e, cardW) {
  ctx.font = `700 ${T.cardTitle}px ${FONT}`;
  const lines = wrap(ctx, cardTitle(e), cardW - CARD_PAD * 2 - BAR_W);
  const timeH = e.isOther ? T.cardTime + 8 : 0;
  const h = CARD_PAD + timeH + lines.length * T.cardTitleLH + 10 + T.pillH + CARD_PAD;
  return { lines, h };
}

function drawPill(ctx, x, y, focus) {
  ctx.font = `700 ${T.pill}px ${FONT}`;
  const w = ctx.measureText(focus.label).width + 28;
  ctx.fillStyle = focus.bg;
  roundRect(ctx, x, y, w, T.pillH, T.pillH / 2);
  ctx.fill();
  ctx.fillStyle = focus.fg;
  ctx.textBaseline = "middle";
  ctx.fillText(focus.label, x + 14, y + T.pillH / 2 + 1);
  ctx.textBaseline = "alphabetic";
  return w;
}

// The logo file is a round badge on a white square, so crop to the
// badge's circle and clip it round.
function drawLogo(ctx, img, cx, cy, r) {
  const side = Math.min(img.width, img.height);
  const crop = side * 0.77;
  const sx = (img.width - crop) / 2;
  const sy = (img.height - crop) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, sx, sy, crop, crop, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export async function renderTimetablePng(
  entries,
  {
    timeSlots,
    days = DEFAULT_DAYS,
    title = "ACAD Online Coaching",
    subtitle = "Live Class Timetable",
    footer = "acadapp.in",
    logoUrl = DEFAULT_LOGO,
  } = {}
) {
  const [logo] = await Promise.all([
    loadImage(logoUrl),
    typeof document !== "undefined" && document.fonts?.ready ? document.fonts.ready : null,
  ]);

  const { columns, grid } = buildGrid(entries, timeSlots, days);
  if (!columns.length) throw new Error("No classes to put on the timetable.");

  const colW = (W - PAD * 2 - DAY_COL) / columns.length;
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

  // Header: round logo + title
  const logoR = LOGO_SIZE / 2;
  const headMid = PAD + LOGO_SIZE / 2;
  let textX = PAD;
  if (logo) {
    drawLogo(ctx, logo, PAD + logoR, headMid, logoR);
    textX = PAD + LOGO_SIZE + 24;
  }
  ctx.fillStyle = C.ink;
  ctx.font = `800 ${T.title}px ${FONT}`;
  ctx.fillText(title, textX, headMid - 4);
  ctx.fillStyle = C.muted;
  ctx.font = `500 ${T.subtitle}px ${FONT}`;
  ctx.fillText(subtitle, textX, headMid + 32);
  ctx.textAlign = "right";
  ctx.font = `600 ${T.note}px ${FONT}`;
  ctx.fillText("All times in IST", W - PAD, headMid + 6);
  ctx.textAlign = "left";

  const tableX = PAD;
  const tableY = PAD + HEADER_H;
  const tableW = W - PAD * 2;

  ctx.save();
  roundRect(ctx, tableX, tableY, tableW, tableH, 16);
  ctx.clip();

  // Column header
  ctx.fillStyle = C.head;
  ctx.fillRect(tableX, tableY, tableW, TABLE_HEAD_H);
  ctx.fillStyle = C.headText;
  ctx.font = `700 ${T.headName}px ${FONT}`;
  ctx.fillText("Day", tableX + 20, tableY + 52);
  columns.forEach((col, i) => {
    const x = tableX + DAY_COL + i * colW + CELL_PAD + 6;
    ctx.fillStyle = C.headText;
    ctx.font = `700 ${T.headName}px ${FONT}`;
    ctx.fillText(col.name, x, tableY + 38);
    ctx.fillStyle = C.headSub;
    ctx.font = `500 ${T.headSub}px ${FONT}`;
    ctx.fillText(col.sub, x, tableY + 66);
  });

  // Rows
  let y = tableY + TABLE_HEAD_H;
  layout.forEach((row, d) => {
    const weekend = days[d] === "Saturday" || days[d] === "Sunday";
    ctx.fillStyle = weekend ? C.weekendBg : C.page;
    ctx.fillRect(tableX, y, tableW, row.h);
    ctx.fillStyle = C.dayBg;
    ctx.fillRect(tableX, y, DAY_COL, row.h);

    ctx.fillStyle = weekend ? C.muted : C.ink;
    ctx.font = `700 ${T.day}px ${FONT}`;
    ctx.fillText(days[d], tableX + 20, y + 48);

    row.cells.forEach((cards, ci) => {
      const cellX = tableX + DAY_COL + ci * colW;
      const cx = cellX + CELL_PAD;
      if (!cards.length) {
        ctx.fillStyle = C.faint;
        ctx.font = `500 ${T.day}px ${FONT}`;
        ctx.textAlign = "center";
        ctx.fillText("—", cellX + colW / 2, y + 50);
        ctx.textAlign = "left";
        return;
      }
      let cy = y + CELL_PAD;
      for (const { e, lines, h } of cards) {
        const focus = focusById(e.focus);
        ctx.fillStyle = "#FFFFFF";
        roundRect(ctx, cx, cy, cardW, h, 12);
        ctx.fill();
        ctx.strokeStyle = C.line;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = focus.bar;
        roundRect(ctx, cx, cy, BAR_W, h, 3);
        ctx.fill();

        const tx = cx + CARD_PAD + BAR_W;
        let ty = cy + CARD_PAD;
        if (e.isOther) {
          ctx.fillStyle = C.muted;
          ctx.font = `600 ${T.cardTime}px ${FONT}`;
          ctx.fillText(`${to12h(e.startTime)} – ${to12h(e.endTime)}`, tx, ty + T.cardTime - 2);
          ty += T.cardTime + 8;
        }
        ctx.fillStyle = C.ink;
        ctx.font = `700 ${T.cardTitle}px ${FONT}`;
        lines.forEach((ln, i) => ctx.fillText(ln, tx, ty + T.cardTitle - 1 + i * T.cardTitleLH));
        ty += lines.length * T.cardTitleLH + 10;
        drawPill(ctx, tx, ty, focus);
        cy += h + CARD_GAP;
      }
    });

    ctx.fillStyle = C.line;
    ctx.fillRect(tableX, y + row.h - 1, tableW, 1);
    y += row.h;
  });

  ctx.fillStyle = C.line;
  for (let i = 0; i <= columns.length; i++) {
    const x = tableX + DAY_COL + i * colW;
    ctx.fillRect(x, tableY + TABLE_HEAD_H, 1, tableH - TABLE_HEAD_H);
  }
  ctx.restore();

  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  roundRect(ctx, tableX + 0.75, tableY + 0.75, tableW - 1.5, tableH - 1.5, 16);
  ctx.stroke();

  // Legend + footer
  const ly = tableY + tableH + 36;
  let lx = PAD;
  ctx.fillStyle = C.muted;
  ctx.font = `600 ${T.legend}px ${FONT}`;
  ctx.fillText("Session focus", lx, ly + 24);
  lx += ctx.measureText("Session focus").width + 18;
  for (const f of SESSION_FOCUS) lx += drawPill(ctx, lx, ly, f) + 12;

  ctx.textAlign = "right";
  ctx.fillStyle = C.muted;
  ctx.font = `500 ${T.legend}px ${FONT}`;
  const stamp = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  ctx.fillText(`${footer}  |  ${stamp}`, W - PAD, ly + 24);
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
