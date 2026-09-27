import { normalize } from "@/lib/format";

/** Wraps word-prefix matches of `tokens` in <mark>, ignoring accents and Arabic letter variants. */
export function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (!tokens.length) return <>{text}</>;
  const norm = normalize(text);
  // normalize() drops Arabic diacritics and can split ligatures; bail if lengths differ.
  if (norm.length !== text.length) return <>{text}</>;
  const ranges: [number, number][] = [];
  for (const t of tokens) {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Word start, optionally after the Arabic article "ال".
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])((?:ال)?)(${escaped})`, "gu");
    for (const m of norm.matchAll(re)) {
      const start = (m.index ?? 0) + m[1].length + m[2].length;
      ranges.push([start, start + m[3].length]);
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
      <mark key={s} className="rounded-[2px] bg-accent-soft text-ink shadow-[0_0_0_2px_var(--accent-soft)] [box-decoration-break:clone]">
        {text.slice(s, e)}
      </mark>,
    );
    cursor = e;
  }
  out.push(text.slice(cursor));
  return <>{out}</>;
}
