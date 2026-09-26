"use client";

import { AlertTriangle, ArrowUpRight, BadgeCheck, CheckCircle2, Copy, Eye, MousePointerClick, ScanLine } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { LogoMark } from "@/components/logo";
import { useToast } from "@/components/providers";
import { Card, CardTitle } from "@/components/ui";
import { accentStyle } from "@/lib/accent";
import { cn, formatVerified } from "@/lib/format";
import { menuActions, useHydrated, useOverrides } from "@/lib/store";
import type { Restaurant } from "@/lib/types";
import { AreaChart, Sparkline } from "./area-chart";
import { MenuEditor } from "./menu-editor";
import { QrCard } from "./qr-card";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** Deterministic mock views per dish, weighted toward "popular" items. */
function topDishes(r: Restaurant, n = 5) {
  const items = r.menus.flatMap((m) => m.sections.flatMap((s) => s.items));
  const weights = items.map((i) => {
    let h = 7;
    for (const c of i.id) h = (h * 31 + c.charCodeAt(0)) % 997;
    return (h / 997 + 0.3) * (i.popular ? 2.6 : 1) * (i.image ? 1.4 : 1);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const pool = r.stats.views30d * 0.62;
  return items
    .map((item, i) => ({ item, views: Math.round((weights[i] / total) * pool) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, n);
}

function dayLabels(n: number) {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

export function Dashboard({ restaurant: r }: { restaurant: Restaurant }) {
  const style = useMemo(() => accentStyle(r.accent), [r.accent]);
  const overrides = useOverrides(r.slug);
  const toast = useToast();
  const claimed = r.claimed || overrides.claimed;
  const canEdit = overrides.isOwner;
  // Dates depend on the viewer's clock, so they're filled in after hydration.
  const hydrated = useHydrated();
  const n = r.stats.daily.length;
  const labels = useMemo(() => (hydrated ? dayLabels(n) : Array<string>(n).fill("")), [hydrated, n]);
  const dishes = useMemo(() => topDishes(r), [r]);
  const googleLinked = r.googleMenuLink || !!overrides.googleOptIn;
  const greetingName = overrides.ownerName?.split(" ")[0];

  const tiles = [
    { label: "Menu views", value: r.stats.views30d, icon: Eye, trend: true },
    { label: "QR scans", value: r.stats.qrScans30d, icon: ScanLine },
    { label: "Link clicks", value: r.stats.linkClicks30d, icon: MousePointerClick },
  ];

  return (
    <div data-accent style={style} className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5">
          <Link href="/" aria-label="mealtree home" className="pressable">
            <LogoMark />
          </Link>
          <span className="text-ink-3">/</span>
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[14.5px] font-semibold">
            {r.name}
            {claimed && <BadgeCheck className="size-4 shrink-0 fill-accent text-bg" strokeWidth={2} />}
          </p>
          <Link
            href={`/r/${r.slug}`}
            className="pressable ml-auto flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3.5 text-[13px] font-medium ring-1 ring-line hover:ring-line-strong"
          >
            Live page <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        {overrides.ready && !canEdit && (
          <div className="mb-5 flex animate-rise flex-wrap items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-[13.5px] text-ink-2 ring-1 ring-accent-line">
            {overrides.pendingReview ? (
              <span className="min-w-0 flex-1">
                <span className="font-medium text-ink">Verification pending.</span> We&apos;ll call {r.name}&apos;s listed
                number to confirm your claim. Editing unlocks right after.
              </span>
            ) : claimed ? (
              <span className="min-w-0 flex-1">
                <span className="font-medium text-ink">View only.</span> {r.name} is managed by its verified owner.
              </span>
            ) : (
              <>
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-ink">Preview.</span> Claim {r.name} to edit the menu.
                </span>
                <Link href={`/claim/${r.slug}`} className="pressable rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-on-accent">
                  Claim now
                </Link>
              </>
            )}
          </div>
        )}

        <h1 className="animate-rise font-display text-[32px] leading-tight tracking-[-0.02em] [font-variation-settings:'opsz'_48]">
          {greetingName ? `Good to see you, ${greetingName}` : "Your menu at a glance"}
        </h1>
        <p className="mt-1 animate-rise text-[14px] text-ink-3 [animation-delay:40ms]">
          Last 30 days · menu updated {formatVerified(r.verifiedAt)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map((t, i) => (
            <div
              key={t.label}
              className={cn("animate-rise rounded-[22px] bg-surface p-4 ring-1 ring-line", i === 0 && "col-span-2 lg:col-span-1")}
              style={{ animationDelay: `${80 + i * 50}ms` }}
            >
              <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3">
                <t.icon className="size-3.5" strokeWidth={2.2} /> {t.label}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="tabular text-[28px] font-semibold leading-none tracking-[-0.02em]">{compact.format(t.value)}</p>
                {t.trend && (
                  <div className="flex items-end gap-3">
                    <Sparkline data={r.stats.daily.slice(-12)} className="h-7 w-20" />
                    <span className={cn("text-[12.5px] font-semibold", r.stats.trendPct >= 0 ? "text-positive" : "text-danger")}>
                      {r.stats.trendPct >= 0 ? "↑" : "↓"} {Math.abs(r.stats.trendPct)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <GoogleTile
            linked={googleLinked}
            index={3}
            onAdd={
              canEdit
                ? () =>
                    menuActions
                      .requestGoogleLink(r.slug)
                      .then(() => toast("Requested — usually live on Google within a day"))
                      .catch((e: Error) => toast(e.message))
                : undefined
            }
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid min-w-0 content-start gap-3">
            <Card className="animate-rise [animation-delay:200ms]">
              <CardTitle>Menu views per day</CardTitle>
              <AreaChart data={r.stats.daily} labels={labels} valueLabel="views" />
            </Card>
            <MenuEditor restaurant={r} canEdit={canEdit} />
          </div>
          <div className="grid min-w-0 content-start gap-3">
            <Card>
              <CardTitle>Most viewed dishes</CardTitle>
              <ol className="space-y-3.5">
                {dishes.map(({ item, views }) => (
                  <li key={item.id}>
                    <div className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="tabular shrink-0 text-ink-2">{views.toLocaleString()}</span>
                    </div>
                    {/* Meter: accent fill on a lighter step of the same hue. */}
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent-soft">
                      <div
                        className="h-full origin-left animate-[grow_900ms_var(--ease-out-expo)_both] rounded-full bg-accent"
                        style={{ width: `${(views / (dishes[0].views || 1)) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
            <QrCard restaurant={r} />
            <ShareCard restaurant={r} />
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleTile({ linked, index, onAdd }: { linked: boolean; index: number; onAdd?: () => void }) {
  return (
    <div
      className="col-span-2 animate-rise rounded-[22px] bg-surface p-4 ring-1 ring-line lg:col-span-1"
      style={{ animationDelay: `${80 + index * 50}ms` }}
    >
      <p className="text-[12.5px] font-medium text-ink-3">Google Maps menu link</p>
      {linked ? (
        <p className="mt-2 flex items-center gap-1.5 text-[15px] font-semibold text-positive">
          <CheckCircle2 className="size-[18px]" strokeWidth={2.2} /> Linked
        </p>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold text-warning">
            <AlertTriangle className="size-[18px]" strokeWidth={2.2} /> Missing
          </p>
          {onAdd && (
            <button onClick={onAdd} className="pressable rounded-full bg-ink px-3 py-1.5 text-[12.5px] font-semibold text-bg">
              Add to Google
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ShareCard({ restaurant: r }: { restaurant: Restaurant }) {
  const toast = useToast();
  const copy = async (text: string, msg: string) => {
    await navigator.clipboard?.writeText(text).catch(() => {});
    toast(msg);
  };
  return (
    <Card>
      <CardTitle>Share your menu</CardTitle>
      <div className="space-y-2">
        {[
          { label: "Instagram bio link", src: "instagram" },
          { label: "Google Business Profile", src: "google" },
          { label: "Delivery app listings", src: "delivery" },
        ].map((x) => (
          <button
            key={x.src}
            onClick={() => copy(`${location.origin}/r/${r.slug}?utm_source=${x.src}`, `${x.label} link copied`)}
            className="pressable flex w-full items-center justify-between rounded-xl bg-surface-2 px-3.5 py-2.5 text-left text-[13.5px] font-medium hover:bg-surface-3"
          >
            {x.label}
            <Copy className="size-4 text-ink-3" strokeWidth={2} />
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-ink-3">Each link is tagged so you can see which channel brings guests.</p>
    </Card>
  );
}
