"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";


function niceMax(v: number) {
  if (!(v > 0)) return 10;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/**
 * Single-series area chart: 2px line, 10% wash, hairline grid, crosshair with
 * tooltip on hover/touch. The series is named by the card title, so no legend.
 */
export function AreaChart({
  data,
  labels,
  height = 180,
  valueLabel,
}: {
  data: number[];
  labels: string[];
  height?: number;
  valueLabel: string;
}) {
  const i18n = useI18n();
  const id = useId();
  const clipId = `reveal-${id.replace(/[^\w-]/g, "")}`;
  const box = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 600;
  const H = height;
  const pad = { t: 8, r: 4, b: 22, l: 0 };
  const max = niceMax(Math.max(...data) * 1.1);
  const x = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);

  const { line, area } = useMemo(() => {
    // Monotone-ish smoothing via cardinal spline with low tension.
    const pts = data.map((v, i) => [x(i), y(v)] as const);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const t = 0.18;
      const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
      const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
      d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
    }
    const base = H - pad.b;
    return { line: d, area: `${d} L${x(data.length - 1)},${base} L${x(0)},${base} Z` };
    // x/y derive from data/max/H only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, max, H]);

  const ticks = [0, max / 2, max];
  const onMove = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (data.length - 1)));
  };

  const hx = hover === null ? 0 : (x(hover) / W) * 100;

  return (
    // Time runs left to right in both languages, as in most Arabic dashboards.
    <div className="relative" dir="ltr">
      <div
        ref={box}
        className="relative touch-pan-y select-none"
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerDown={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block w-full" style={{ height: H }} aria-hidden>
          <defs>
            {/* Reveal left-to-right with a clip: pathLength + non-scaling-stroke leaves gaps in Chromium. */}
            <clipPath id={clipId}>
              <motion.rect
                x={0}
                y={0}
                height={H}
                initial={{ width: 0 }}
                animate={{ width: W }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </clipPath>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1={0} x2={W} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <g clipPath={`url(#${clipId})`}>
            <path d={area} fill="var(--accent)" fillOpacity={0.1} />
            <path
              d={line}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
          {hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.t}
              y2={H - pad.b}
              stroke="var(--line-strong)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {/* Marker in HTML so it stays round under preserveAspectRatio="none". */}
        {hover !== null && (
          <span
            className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-surface"
            style={{ left: `${hx}%`, top: y(data[hover]) }}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between text-2xs text-ink-3">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels.at(-1)}</span>
        </div>
        {ticks.slice(1).map((t) => (
          <span
            key={t}
            className="tabular pointer-events-none absolute left-0 text-2xs leading-none text-ink-3"
            style={{ top: y(t) + 4 }}
          >
            {i18n.compact(t)}
          </span>
        ))}
        <AnimatePresence>
          {hover !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-bg shadow-md"
              style={{ left: `clamp(48px, ${hx}%, calc(100% - 48px))` }}
            >
              <span className="tabular font-semibold">{i18n.number(data[hover])}</span>{" "}
              <span className="opacity-70">
                {valueLabel} · {labels[hover]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <table className="sr-only" aria-labelledby={id}>
        <caption id={id}>{valueLabel} per day</caption>
        <tbody>
          {data.map((v, i) => (
            <tr key={i}>
              <th scope="row">{labels[i]}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const clipId = `spark-${useId().replace(/[^\w-]/g, "")}`;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <motion.rect
            x={0}
            y={0}
            height={30}
            initial={{ width: 0 }}
            animate={{ width: 100 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </clipPath>
      </defs>
      <polyline
        points={pts}
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
