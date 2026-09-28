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
