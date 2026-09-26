import type { Hours } from "./types";

type Day = keyof Hours;

export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatRanges(ranges: [string, string][]) {
  if (!ranges.length) return "Closed";
  return ranges.map(([o, c]) => `${formatTime(o)} – ${formatTime(c)}`).join(", ");
}

/** Current weekday and minutes-past-midnight in the restaurant's timezone. */
export function nowIn(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")) as Day;
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export type OpenStatus = {
  open: boolean;
  /** Closing within 45 minutes. */
  soon: boolean;
  headline: string;
  detail: string;
};

export function openStatus(hours: Hours, timezone: string, date = new Date()): OpenStatus {
  const { day, minutes } = nowIn(timezone, date);
  const yesterday = ((day + 6) % 7) as Day;

  // Spans that started yesterday and run past midnight.
  for (const [o, c] of hours[yesterday]) {
    if (toMin(c) < toMin(o) && minutes < toMin(c)) {
      return closing(toMin(c) - minutes, c);
    }
  }
  for (const [o, c] of hours[day]) {
    const open = toMin(o);
    const close = toMin(c) <= open ? toMin(c) + 1440 : toMin(c);
    if (minutes >= open && minutes < close) return closing(close - minutes, c);
  }

  // Closed: find the next opening in the coming week.
  for (let offset = 0; offset < 7; offset++) {
    const d = ((day + offset) % 7) as Day;
    const next = hours[d].map(([o]) => o).find((o) => offset > 0 || toMin(o) > minutes);
    if (next) {
      const when = offset === 0 ? "" : offset === 1 ? "tomorrow " : `${dayNames[d].slice(0, 3)} `;
      return { open: false, soon: false, headline: "Closed", detail: `opens ${when}${formatTime(next)}` };
    }
  }
  return { open: false, soon: false, headline: "Closed", detail: "temporarily" };
}

function closing(remaining: number, close: string): OpenStatus {
  const soon = remaining <= 45;
  return { open: true, soon, headline: soon ? "Closing soon" : "Open", detail: `until ${formatTime(close)}` };
}

/**
 * Parses "11:30-15:00, 5pm-10:30pm" or "closed" into [open, close] pairs.
 * Returns null when the text can't be understood.
 */
export function parseRanges(text: string): [string, string][] | null {
  const t = text.trim().toLowerCase();
  if (!t || t === "closed" || t === "-") return [];
  const out: [string, string][] = [];
  for (const part of t.split(/[,;]+/).map((p) => p.trim()).filter(Boolean)) {
    const m = part.split(/\s*(?:-|–|—|to)\s*/);
    if (m.length !== 2) return null;
    const open = parseTime(m[0]);
    const close = parseTime(m[1]);
    if (!open || !close) return null;
    out.push([open, close]);
  }
  return out;
}

function parseTime(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = m[3]?.[0];
  if (ap === "p" && h < 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Inverse of parseRanges, for editing. */
export function rangesToText(ranges: [string, string][]) {
  return ranges.length ? ranges.map(([o, c]) => `${o}-${c}`).join(", ") : "Closed";
}
