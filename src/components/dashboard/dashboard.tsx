"use client";

import { ArrowUpRight, BadgeCheck, Copy } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { LogoMark } from "@/components/logo";
import { useToast } from "@/components/providers";
import { Card, CardTitle } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { formatDayMonth } from "@/i18n/format";
import { accentStyle } from "@/lib/accent";
import { cn } from "@/lib/format";
import { actionErrorMessage, menuActions, useHydrated, useOverrides } from "@/lib/store";
import type { Restaurant } from "@/lib/types";
import { AreaChart, Sparkline } from "./area-chart";
import { MenuEditor } from "./menu-editor";
import { QrCard } from "./qr-card";

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

export function Dashboard({ restaurant: r }: { restaurant: Restaurant }) {
  const i18n = useI18n();
  const { t, pick, href } = i18n;
  const style = useMemo(() => accentStyle(r.accent), [r.accent]);
  const overrides = useOverrides(r.slug);
  const toast = useToast();
  const claimed = r.claimed || overrides.claimed;
  const canEdit = overrides.isOwner;
  const name = pick(r.name, r.nameAr);
  // Dates depend on the viewer's clock, so they're filled in after hydration.
  const hydrated = useHydrated();
  const n = r.stats.daily.length;
  const labels = useMemo(() => {
    if (!hydrated) return Array<string>(n).fill("");
    const today = new Date();
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (n - 1 - i));
      return formatDayMonth(d, i18n.locale);
    });
  }, [hydrated, n, i18n.locale]);
  const dishes = useMemo(() => topDishes(r), [r]);
  const googleLinked = r.googleMenuLink || !!overrides.googleOptIn;
  const greetingName = overrides.ownerName?.split(" ")[0];

  const tiles = [
    { label: t.dashboard.views, value: r.stats.views30d, trend: true },
    { label: t.dashboard.scans, value: r.stats.qrScans30d },
    { label: t.dashboard.clicks, value: r.stats.linkClicks30d },
  ];

  return (
    <div data-accent style={style} className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href={href("/")} aria-label="mealtree" className="pressable">
            <LogoMark />
          </Link>
          <span className="text-ink-3">/</span>
          <p className="flex min-w-0 items-center gap-1.5 truncate text-base font-semibold">
            <span className="truncate">{name}</span>
            {claimed && <BadgeCheck className="size-4 shrink-0 fill-accent text-bg" strokeWidth={2} />}
          </p>
          <div className="ms-auto flex shrink-0 items-center gap-1">
            <LanguageToggle />
            <Link
              href={href(`/r/${r.slug}`)}
              className="pressable flex h-9 items-center gap-1 rounded-lg border border-line-strong px-3 text-sm font-medium hover:bg-surface-2"
            >
              {t.dashboard.livePage} <ArrowUpRight className="size-3.5 rtl:-scale-x-100" strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {overrides.ready && !canEdit && (
          <div className="mb-5 flex animate-fade flex-wrap items-center gap-3 rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink-2">
            <span className="min-w-0 flex-1">
              {overrides.pendingReview
                ? t.dashboard.pendingBanner(name)
                : claimed
                  ? t.dashboard.viewOnly(name)
                  : t.dashboard.preview(name)}
            </span>
            {!overrides.pendingReview && !claimed && (
              <Link
                href={href(`/claim/${r.slug}`)}
                className="pressable rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-on-accent"
              >
                {t.dashboard.claimNow}
              </Link>
            )}
          </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {greetingName ? t.dashboard.greeting(greetingName) : t.dashboard.title}
        </h1>
        <p className="mt-1 text-sm text-ink-3">{t.dashboard.subtitle(i18n.date(r.verifiedAt))}</p>

        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-line lg:grid-cols-4">
          {tiles.map((tile, i) => (
            <div
              key={tile.label}
              className={cn(
                "border-line p-4",
                i === 0 ? "col-span-2 border-b lg:col-span-1 lg:border-b-0 lg:border-e" : "border-e",
                i === 2 && "max-lg:border-e-0",
              )}
            >
              <p className="text-sm text-ink-3">{tile.label}</p>
              <div className="mt-1.5 flex items-end justify-between gap-3">
                <p className="tabular text-3xl font-semibold leading-none">{i18n.compact(tile.value)}</p>
                {tile.trend && (
                  <div className="flex items-end gap-3">
                    <Sparkline data={r.stats.daily.slice(-12)} className="h-7 w-20" />
                    <span
                      dir="ltr"
                      className={cn("text-sm font-semibold", r.stats.trendPct >= 0 ? "text-positive" : "text-danger")}
                    >
                      {r.stats.trendPct >= 0 ? "+" : "−"}
                      {Math.abs(r.stats.trendPct)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <GoogleTile
            linked={googleLinked}
            onAdd={
              canEdit
                ? () =>
                    menuActions
                      .requestGoogleLink(r.slug)
                      .then(() => toast(t.dashboard.googleRequested))
                      .catch((e) => toast(actionErrorMessage(e, t)))
                : undefined
            }
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid min-w-0 content-start gap-4">
            <Card>
              <CardTitle>{t.dashboard.viewsPerDay}</CardTitle>
              <AreaChart data={r.stats.daily} labels={labels} valueLabel={t.dashboard.viewsUnit} />
            </Card>
            <MenuEditor restaurant={r} canEdit={canEdit} />
          </div>
          <div className="grid min-w-0 content-start gap-4">
            <Card>
              <CardTitle>{t.dashboard.topDishes}</CardTitle>
              <ol className="space-y-3.5">
                {dishes.map(({ item, views }) => (
                  <li key={item.id}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{pick(item.name, item.nameAr)}</span>
                      <span className="tabular shrink-0 text-ink-2">{i18n.number(views)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent-soft">
                      <div
                        className="h-full animate-[grow_900ms_var(--ease-out-expo)_both] rounded-full bg-accent ltr:origin-left rtl:origin-right"
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

function GoogleTile({ linked, onAdd }: { linked: boolean; onAdd?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="col-span-2 border-t border-line p-4 lg:col-span-1 lg:border-t-0">
      <p className="text-sm text-ink-3">{t.dashboard.google}</p>
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className={cn("text-lg font-semibold", linked ? "text-positive" : "text-warning")}>
          {linked ? t.dashboard.linked : t.dashboard.missing}
        </p>
        {!linked && onAdd && (
          <button onClick={onAdd} className="pressable rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-bg">
            {t.dashboard.addToGoogle}
          </button>
        )}
      </div>
    </div>
  );
}

function ShareCard({ restaurant: r }: { restaurant: Restaurant }) {
  const { t } = useI18n();
  const toast = useToast();
  const copy = async (text: string, msg: string) => {
    await navigator.clipboard?.writeText(text).catch(() => {});
    toast(msg);
  };
  const targets = t.dashboard.shareTargets;
  return (
    <Card>
      <CardTitle>{t.dashboard.share}</CardTitle>
      <div className="divide-y divide-line border-y border-line">
        {(Object.keys(targets) as (keyof typeof targets)[]).map((src) => (
          <button
            key={src}
            // Bare /r/… links pick the viewer's language.
            onClick={() => copy(`${location.origin}/r/${r.slug}?utm_source=${src}`, t.dashboard.shareCopied(targets[src]))}
            className="flex w-full items-center justify-between py-3 text-start text-sm font-medium hover:text-ink-2"
          >
            {targets[src]}
            <Copy className="size-4 text-ink-3" strokeWidth={2} />
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-3">{t.dashboard.shareNote}</p>
    </Card>
  );
}
