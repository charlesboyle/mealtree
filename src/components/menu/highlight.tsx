import { normalize } from "@/lib/format";

/** Wraps word-prefix matches of `tokens` in <mark>, ignoring accents. */
export function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (!tokens.length) return <>{text}</>;
  const norm = normalize(text);
  // normalize() can change string length (ligatures), bail out if it did.
  if (norm.length !== text.length) return <>{text}</>;
  const ranges: [number, number][] = [];
  for (const t of tokens) {
    const re = new RegExp(`(^|[^a-z0-9])(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "g");
    for (const m of norm.matchAll(re)) {
      const start = (m.index ?? 0) + m[1].length;
      ranges.push([start, start + m[2].length]);
    }
  }
  if (!ranges.length) return <>{text}</>;
  ranges.sort((a, b) => a[0] - b[0]);
  const out: React.ReactNode[] = [];
  let cursor = 0;
  for (const [s, e] of ranges) {
    if (s < cursor) continue;
    if (s > cursor) out.push(text.slice(cursor, s));
    out.push(
      <mark key={s} className="rounded-[3px] bg-accent-soft text-ink shadow-[0_0_0_2px_var(--accent-soft)] [box-decoration-break:clone]">
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  }
  out.push(text.slice(cursor));
  return <>{out}</>;
}
