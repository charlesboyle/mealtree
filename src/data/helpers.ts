import type { Hours } from "@/lib/types";

type Range = [string, string][];

/** Build a weekly schedule. `closed` lists weekdays (0 = Sunday) with no service. */
export function schedule(
  ranges: Range,
  opts: { closed?: number[]; overrides?: Partial<Record<number, Range>> } = {},
): Hours {
  const hours = {} as Hours;
  for (let d = 0 as keyof Hours; d <= 6; d = (d + 1) as keyof Hours) {
    hours[d] = opts.closed?.includes(d) ? [] : (opts.overrides?.[d] ?? ranges);
  }
  return hours;
}

/** Deterministic daily view counts so server and client renders agree. */
export function mockDaily(seed: string, base: number, days = 30): number[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
  return Array.from({ length: days }, (_, i) => {
    const weekend = i % 7 === 5 || i % 7 === 6 ? 1.35 : 1;
    const growth = 0.7 + (i / days) * 0.6;
    return Math.round(base * weekend * growth * (0.75 + rand() * 0.5));
  });
}

export function stats(seed: string, base: number) {
  const daily = mockDaily(seed, base);
  const views30d = daily.reduce((a, b) => a + b, 0);
  const half = Math.floor(daily.length / 2);
  const first = daily.slice(0, half).reduce((a, b) => a + b, 0);
  const second = daily.slice(half).reduce((a, b) => a + b, 0);
  return {
    daily,
    views30d,
    /** Second half of the window vs the first, as a stand-in for period-over-period. */
    trendPct: Math.round(((second - first) / first) * 100),
    qrScans30d: Math.round(views30d * 0.18),
    linkClicks30d: Math.round(views30d * 0.11),
  };
}
