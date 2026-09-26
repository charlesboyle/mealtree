"use client";

import { motion } from "motion/react";
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Logo } from "@/components/logo";
import { Photo } from "@/components/photo";
import { useToast } from "@/components/providers";
import { accentStyle } from "@/lib/accent";
import { cn, sourceLabel } from "@/lib/format";
import { useHydrated } from "@/lib/store";
import type { Restaurant } from "@/lib/types";

const STALE_DAYS = 30;
type Tab = "all" | "unclaimed" | "no-google" | "stale";

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000);
}

function pitch(r: Restaurant, origin: string) {
  return [
    `Hi ${r.name} team!`,
    `We put your menu online so guests can check prices before they visit: ${origin}/r/${r.slug}`,
    `${r.stats.views30d.toLocaleString()} people looked at it in the last 30 days.`,
    `It's free to claim — you can fix prices, mark sold-out dishes, and get QR codes for your tables: ${origin}/claim/${r.slug}`,
  ].join("\n\n");
}

export function OpsBoard({ restaurants }: { restaurants: Restaurant[] }) {
  const hydrated = useHydrated();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("all");

  const rows = useMemo(
    () =>
      restaurants
        .map((r) => ({ r, age: hydrated ? daysSince(r.verifiedAt) : null }))
        .sort((a, b) => Number(a.r.claimed) - Number(b.r.claimed) || b.r.stats.views30d - a.r.stats.views30d),
    [restaurants, hydrated],
  );
  const counts = {
    all: rows.length,
    unclaimed: rows.filter((x) => !x.r.claimed).length,
    "no-google": rows.filter((x) => !x.r.googleMenuLink).length,
    stale: rows.filter((x) => (x.age ?? 0) > STALE_DAYS).length,
  };
  const visible = rows.filter(({ r, age }) =>
    tab === "unclaimed" ? !r.claimed : tab === "no-google" ? !r.googleMenuLink : tab === "stale" ? (age ?? 0) > STALE_DAYS : true,
  );
  const totalViews = restaurants.reduce((n, r) => n + r.stats.views30d, 0);
  const claimedPct = Math.round(((rows.length - counts.unclaimed) / rows.length) * 100);

  const tiles = [
    { label: "Restaurants listed", value: rows.length.toString() },
    { label: "Claimed", value: `${claimedPct}%`, sub: `${rows.length - counts.unclaimed} of ${rows.length}` },
    { label: "No menu link on Google", value: counts["no-google"].toString(), sub: "outreach targets" },
    { label: "Menu views (30d)", value: totalViews.toLocaleString() },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unclaimed", label: "Unclaimed" },
    { id: "no-google", label: "No Google link" },
    { id: "stale", label: "Needs re-verify" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5">
          <Logo />
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">Ops</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        <h1 className="font-display text-[32px] leading-tight tracking-[-0.02em] [font-variation-settings:'opsz'_48]">Outreach pipeline</h1>
        <p className="mt-1 text-[14px] text-ink-3">Mission District · internal view. Copy a pitch, send it, track who claims.</p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <div key={t.label} className="animate-rise rounded-[22px] bg-surface p-4 ring-1 ring-line" style={{ animationDelay: `${i * 50}ms` }}>
              <p className="text-[12.5px] font-medium text-ink-3">{t.label}</p>
              <p className="tabular mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]">{t.value}</p>
              {t.sub && <p className="mt-1.5 text-[12px] text-ink-3">{t.sub}</p>}
            </div>
          ))}
        </div>

        <div role="tablist" className="no-scrollbar -mx-5 mt-6 flex gap-1 overflow-x-auto px-5">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn("relative shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors", tab === t.id ? "text-bg" : "text-ink-2 hover:text-ink")}
            >
              {tab === t.id && <motion.span layoutId="ops-tab" className="absolute inset-0 rounded-full bg-ink" />}
              <span className="relative">
                {t.label} <span className="tabular opacity-60">{counts[t.id]}</span>
              </span>
            </button>
          ))}
        </div>

        <ul className="mt-4 overflow-hidden rounded-[24px] bg-surface ring-1 ring-line">
          {visible.map(({ r, age }) => (
            <li
              key={r.slug}
              data-accent
              style={accentStyle(r.accent)}
              className="grid gap-3 border-b border-line p-4 last:border-0 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr_0.7fr_auto] md:items-center md:gap-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Photo id={r.cover} alt="" width={80} className="size-11 shrink-0 rounded-xl" iconSize={16} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[14.5px] font-semibold">
                    {r.name}
                    {r.claimed && <BadgeCheck className="size-4 shrink-0 fill-accent text-bg" strokeWidth={2} />}
                  </p>
                  <p className="truncate text-[12.5px] text-ink-3">
                    {sourceLabel[r.source]}
                    {age !== null && (
                      <span className={cn(age > STALE_DAYS && "font-medium text-warning")}> · verified {age}d ago</span>
                    )}
                  </p>
                </div>
              </div>
              <Status ok={r.claimed} okLabel="Claimed" badLabel="Unclaimed" neutral />
              <Status ok={r.googleMenuLink} okLabel="On Google" badLabel="No Google link" />
              <p className="tabular text-[14px] font-medium md:text-right">
                {r.stats.views30d.toLocaleString()} <span className="font-normal text-ink-3">views</span>
              </p>
              <div className="flex gap-2">
                {!r.claimed && (
                  <button
                    onClick={async () => {
                      await navigator.clipboard?.writeText(pitch(r, location.origin)).catch(() => {});
                      toast("Pitch copied — paste into DM or email");
                    }}
                    className="pressable flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12.5px] font-semibold text-bg"
                  >
                    <Copy className="size-3.5" strokeWidth={2.2} /> Copy pitch
                  </button>
                )}
                <Link
                  href={`/r/${r.slug}`}
                  aria-label={`Open ${r.name} menu`}
                  className="pressable grid size-9 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink"
                >
                  <ExternalLink className="size-4" strokeWidth={2} />
                </Link>
              </div>
            </li>
          ))}
          {visible.length === 0 && <li className="p-10 text-center text-[14px] text-ink-3">Nothing here. Nice.</li>}
        </ul>
        <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink-3">
          <Clock className="size-3.5" /> Menus older than {STALE_DAYS} days should be re-verified before outreach.
        </p>
      </main>
    </div>
  );
}

function Status({ ok, okLabel, badLabel, neutral }: { ok: boolean; okLabel: string; badLabel: string; neutral?: boolean }) {
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  return (
    <span className={cn("flex items-center gap-1.5 text-[13px] font-medium", ok ? "text-positive" : neutral ? "text-ink-3" : "text-warning")}>
      <Icon className="size-4" strokeWidth={2.2} /> {ok ? okLabel : badLabel}
    </span>
  );
}
