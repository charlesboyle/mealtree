/**
 * Locale-aware formatting that renders identically on the server and in the
 * browser (no Intl output that varies between ICU builds), so hydration
 * never disagrees.
 */
import type { Locale } from "./config";
import { dictionaries } from "./dictionaries";

const CURRENCY: Record<string, Record<Locale, string>> = {
  AED: { en: "AED", ar: "د.إ" },
};

export function currencyLabel(currency: string, locale: Locale) {
  return CURRENCY[currency]?.[locale] ?? currency;
}

function groupDigits(int: string) {
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "25" for whole dirhams, "12.50" otherwise — never "12.5". */
export function formatAmount(n: number) {
  if (Number.isInteger(n)) return groupDigits(String(n));
  const [int, frac] = n.toFixed(2).split(".");
  return `${groupDigits(int)}.${frac}`;
}

/** "AED 25" in English, "25 د.إ" in Arabic. */
export function formatPrice(n: number, locale: Locale, currency = "AED") {
  const label = currencyLabel(currency, locale);
  return locale === "ar" ? `${formatAmount(n)} ${label}` : `${label} ${formatAmount(n)}`;
}

export function formatNumber(n: number) {
  return groupDigits(String(Math.round(n)));
}

/** Exact below 10,000 ("2,952"), then 12.3K / 12.3 ألف. */
export function formatCompact(n: number, locale: Locale) {
  if (Math.abs(n) < 10000) return formatNumber(n);
  const k = Math.round((n / 1000) * 10) / 10;
  const s = Number.isInteger(k) ? String(k) : k.toFixed(1);
  return locale === "ar" ? `${s} ألف` : `${s}K`;
}

/** "7 PM", "11:30 AM" · "7 م", "11:30 ص" */
export function formatTime(hhmm: string, locale: Locale) {
  const t = dictionaries[locale].hours;
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? t.pm : t.am;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatRanges(ranges: [string, string][], locale: Locale) {
  const t = dictionaries[locale].hours;
  if (!ranges.length) return t.closed;
  if (ranges.length === 1 && ranges[0][0] === "00:00" && ranges[0][1] === "00:00") return t.open24;
  const sep = locale === "ar" ? "، " : ", ";
  return ranges.map(([o, c]) => `${formatTime(o, locale)} – ${formatTime(c, locale)}`).join(sep);
}

/** "18 Sep 2026" · "18 سبتمبر 2026" (ISO date, no time zone shifts). */
export function formatDate(iso: string, locale: Locale) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${dictionaries[locale].hours.months[m - 1]} ${y}`;
}

/** "18 Sep" · "18 سبتمبر" */
export function formatDayMonth(date: Date, locale: Locale) {
  return `${date.getDate()} ${dictionaries[locale].hours.months[date.getMonth()]}`;
}

/**
 * UAE numbers in international form: "+971 4 321 7788", "+971 50 123 4567".
 * Always render inside dir="ltr" so the digits keep their order in Arabic.
 */
export function formatPhone(e164: string) {
  const m = e164.match(/^\+971(5\d|[2-9])(\d{3})(\d{4})$/);
  return m ? `+971 ${m[1]} ${m[2]} ${m[3]}` : e164;
}

/** "•••• 7788", for showing which number a code goes to. */
export function maskPhone(e164: string) {
  const m = e164.match(/^\+971(5\d|[2-9])\d{3}(\d{4})$/);
  return m ? `+971 ${m[1]} ••• ${m[2]}` : `••• ${e164.slice(-4)}`;
}

export function priceLevelLabel(level: number, locale: Locale) {
  return dictionaries[locale].price.levels[level - 1] ?? "";
}

export function cuisineLabel(cuisine: string, locale: Locale) {
  return dictionaries[locale].cuisines[cuisine] ?? cuisine;
}

export function listSeparator(locale: Locale) {
  return locale === "ar" ? "، " : ", ";
}
