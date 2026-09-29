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
import type { Restaurant, RestaurantStats } from "@/lib/types";
import { useStats } from "@/lib/use-stats";
import { AreaChart, Sparkline } from "./area-chart";
import { MenuEditor } from "./menu-editor";
import { QrCard } from "./qr-card";

/** Traffic sources as owners would name them; unknown referrers show their hostname. */
function sourceKey(source: string) {
  if (/(^|\.)google\./.test(source) || source === "google") return "google";
  if (/instagram/.test(source)) return "instagram";
  if (/whatsapp|^wa\.me$/.test(source)) return "whatsapp";
  if (/talabat|deliveroo|careem|noon|delivery/.test(source)) return "delivery";
  return source;
}

export function Dashboard({ restaurant: r, initialStats }: { restaurant: Restaurant; initialStats: RestaurantStats }) {
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
  const stats = useStats(r.slug, initialStats);
  const n = stats.daily.length;
  const labels = useMemo(() => {
    if (!hydrated) return Array<string>(n).fill("");
    const today = new Date();
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (n - 1 - i));
      return formatDayMonth(d, i18n.locale);
    });
  }, [hydrated, n, i18n.locale]);
  const dishes = useMemo(() => {
    const items = new Map(r.menus.flatMap((m) => m.sections.flatMap((s) => s.items)).map((i) => [i.id, i]));
    return stats.topDishes.flatMap(({ itemId, views }) => {
      const item = items.get(itemId);
      return item ? [{ key: itemId, label: pick(item.name, item.nameAr), value: views }] : [];
    });
  }, [r.menus, stats.topDishes, pick]);
  const sources = useMemo(() => {
    const names = t.dashboard.sourceNames as Record<string, string>;
    const merged = new Map<string, number>();
    for (const { source, views } of stats.sources) {
      const k = sourceKey(source);
      merged.set(k, (merged.get(k) ?? 0) + views);
    }
    return [...merged]
      .sort((a, b) => b[1] - a[1])
      .map(([k, value]) => ({ key: k, label: names[k] ?? k, value }));
  }, [stats.sources, t]);
  const googleLinked = r.googleMenuLink || !!overrides.googleOptIn;
  const greetingName = overrides.ownerName?.split(" ")[0];

  const tiles = [
    { label: t.dashboard.views, value: stats.views30d, trend: true },
    { label: t.dashboard.scans, value: stats.qrScans30d },
    { label: t.dashboard.clicks, value: stats.linkClicks30d },
  ];

  return (
    <div data-accent style={style} className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4 sm:px-5">
          <Link href={href("/")} aria-label="nomm" className="pressable">
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

      <main className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-5">
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

        <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-line">
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
                {tile.trend && stats.views30d > 0 && (
                  <div className="flex items-end gap-3">
                    <Sparkline data={stats.daily.slice(-12)} className="h-7 w-20" />
                    {stats.trendPct !== null && (
                      <span
                        dir="ltr"
                        className={cn("text-sm font-semibold", stats.trendPct >= 0 ? "text-positive" : "text-danger")}
                      >
                        {stats.trendPct >= 0 ? "+" : "−"}
                        {Math.abs(stats.trendPct)}%
                      </span>
                    )}
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

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="grid min-w-0 content-start gap-4">
            <Card>
              <CardTitle>{t.dashboard.viewsPerDay}</CardTitle>
              <AreaChart data={stats.daily} labels={labels} valueLabel={t.dashboard.viewsUnit} />
              {stats.views30d === 0 && <p className="mt-3 text-sm text-ink-3">{t.dashboard.noViewsYet}</p>}
            </Card>
            <MenuEditor restaurant={r} canEdit={canEdit} />
          </div>
          <div className="grid min-w-0 content-start gap-4">
            <Card>
              <CardTitle>{t.dashboard.topDishes}</CardTitle>
              <Meters rows={dishes} empty={t.dashboard.noDishViews} />
            </Card>
            <Card>
              <CardTitle>{t.dashboard.sources}</CardTitle>
              <Meters rows={sources} empty={t.dashboard.noViewsYet} />
            </Card>
            <QrCard restaurant={r} />
            <ShareCard restaurant={r} />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Ranked bars on a lighter step of the accent, largest first. */
function Meters({ rows, empty }: { rows: { key: string; label: string; value: number }[]; empty: string }) {
  const { number } = useI18n();
  if (!rows.length) return <p className="text-sm text-ink-3">{empty}</p>;
  const max = rows[0].value || 1;
  return (
    <ol className="space-y-3.5">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{row.label}</span>
            <span className="tabular shrink-0 text-ink-2">{number(row.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-accent-soft">
            <div
              className="h-full animate-[grow_900ms_var(--ease-out-expo)_both] rounded-full bg-accent ltr:origin-left rtl:origin-right"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
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
