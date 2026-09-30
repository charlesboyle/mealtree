import type { I18n } from "@/i18n";
import type { Hours } from "./types";

type Day = keyof Hours;

/** English day names for the admin tools; public pages use the dictionary. */
export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

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

export type OpenStatus =
  | { open: true; /** Closing within 45 minutes. */ soon: boolean; until: string; /** Open around the clock today (open time equals close time). */ allDay?: boolean }
  | { open: false; soon: false; /** Days from today (0 = later today), or null if nothing this week. */ next: { offset: number; day: Day; time: string } | null };

export function openStatus(hours: Hours, timezone: string, date = new Date()): OpenStatus {
  const { day, minutes } = nowIn(timezone, date);
  const yesterday = ((day + 6) % 7) as Day;
  const closing = (remaining: number, until: string): OpenStatus => ({ open: true, soon: remaining <= 45, until });

  // Spans that started yesterday and run past midnight.
  for (const [o, c] of hours[yesterday]) {
    if (toMin(c) < toMin(o) && minutes < toMin(c)) return closing(toMin(c) - minutes, c);
  }
  for (const [o, c] of hours[day]) {
    const open = toMin(o);
    const close = toMin(c) <= open ? toMin(c) + 1440 : toMin(c);
    if (minutes >= open && minutes < close) {
      if (toMin(c) === open) return { open: true, soon: false, until: c, allDay: true };
      return closing(close - minutes, c);
    }
  }

  // Closed: find the next opening in the coming week.
  for (let offset = 0; offset < 7; offset++) {
    const d = ((day + offset) % 7) as Day;
    const time = hours[d].map(([o]) => o).find((o) => offset > 0 || toMin(o) > minutes);
    if (time) return { open: false, soon: false, next: { offset, day: d, time } };
  }
  return { open: false, soon: false, next: null };
}

/** "Open" + "until 2 AM", "Closed" + "opens tomorrow 7 AM", in the viewer's language. */
export function describeStatus(s: OpenStatus, i18n: I18n) {
  const t = i18n.t.hours;
  if (s.open && s.allDay) return { headline: t.open24, detail: "" };
  if (s.open) return { headline: s.soon ? t.closingSoon : t.open, detail: t.until(i18n.time(s.until)) };
  if (!s.next) return { headline: t.closed, detail: t.temporarily };
  const time = i18n.time(s.next.time);
  const detail =
    s.next.offset === 0
      ? t.opensAt(time)
      : s.next.offset === 1
        ? t.opensTomorrow(time)
        : t.opensOn(t.daysShort[s.next.day], time);
  return { headline: t.closed, detail };
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
