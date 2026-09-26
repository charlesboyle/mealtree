"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  EyeOff,
  Loader2,
  LogOut,
  Pencil,
  Phone,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { reviewClaim, resolveRemoval, setPublished, signOut } from "@/app/ops/actions";
import { Logo } from "@/components/logo";
import { Photo } from "@/components/photo";
import { useToast } from "@/components/providers";
import { accentStyle } from "@/lib/accent";
import { cn, formatPhone, sourceLabel } from "@/lib/format";
import { useHydrated } from "@/lib/store";
import type { AdminOverview, ClaimRow, RemovalRow } from "@/lib/supabase/database";

const STALE_DAYS = 30;
type Row = AdminOverview["restaurants"][number];
type Tab = "all" | "unclaimed" | "no-google" | "stale" | "hidden";
type View = "pipeline" | "claims" | "removals";

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso + "T12:00:00").getTime()) / 86400000);
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function pitch(r: Row, origin: string) {
  return [
    `Hi ${r.name} team!`,
    `We put your menu online so guests can check prices before they visit: ${origin}/r/${r.slug}`,
    r.stats.views30d > 0 ? `${r.stats.views30d.toLocaleString()} people looked at it in the last 30 days.` : "",
    `It's free to claim — you can fix prices, mark sold-out dishes, and get QR codes for your tables: ${origin}/claim/${r.slug}`,
    `If you'd rather not be listed, reply and we'll take it down: ${origin}/remove?r=${r.slug}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Runs a server action, toasts the outcome, and refreshes server data. */
function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const run = (key: string, fn: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    setBusy(key);
    start(async () => {
      const res = await fn();
      toast(res.ok ? success : (res.error ?? "Something went wrong"));
      router.refresh();
      setBusy(null);
    });
  };
  return { run, busy: pending ? busy : null };
}

export function OpsBoard({ overview }: { overview: AdminOverview }) {
  const hydrated = useHydrated();
  const pendingClaims = overview.claims.filter((c) => c.status === "pending").length;
  const openRemovals = overview.removals.filter((r) => r.status === "open").length;
  const [view, setView] = useState<View>(pendingClaims ? "claims" : "pipeline");

  const views: { id: View; label: string; count?: number }[] = [
    { id: "pipeline", label: "Pipeline" },
    { id: "claims", label: "Claims", count: pendingClaims },
    { id: "removals", label: "Takedowns", count: openRemovals },
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-5">
          <Logo />
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-3">Ops</span>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/ops/new"
              className="pressable flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3.5 text-[13px] font-semibold text-bg"
            >
              <Plus className="size-4" strokeWidth={2.4} /> Add<span className="hidden sm:inline"> restaurant</span>
            </Link>
            <form action={signOut}>
              <button aria-label="Sign out" className="pressable grid size-9 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink">
                <LogOut className="size-4" strokeWidth={2.2} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        <h1 className="font-display text-[32px] leading-tight tracking-[-0.02em] [font-variation-settings:'opsz'_48]">Outreach pipeline</h1>
        <p className="mt-1 text-[14px] text-ink-3">Add menus, send pitches, verify owners, handle takedowns.</p>

        <Tiles overview={overview} hydrated={hydrated} />

        <div role="tablist" className="mt-6 inline-flex rounded-full bg-surface-2 p-1">
          {views.map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={cn("relative rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition-colors", view === v.id ? "text-ink" : "text-ink-3 hover:text-ink-2")}
            >
              {view === v.id && <motion.span layoutId="ops-view" className="absolute inset-0 rounded-full bg-surface shadow-sm" />}
              <span className="relative flex items-center gap-1.5">
                {v.label}
                {!!v.count && (
                  <span className="tabular grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] leading-5 text-white">{v.count}</span>
                )}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {view === "pipeline" && <Pipeline rows={overview.restaurants} hydrated={hydrated} />}
            {view === "claims" && <Claims claims={overview.claims} hydrated={hydrated} />}
            {view === "removals" && <Removals removals={overview.removals} hydrated={hydrated} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Tiles({ overview, hydrated }: { overview: AdminOverview; hydrated: boolean }) {
  const rows = overview.restaurants.filter((r) => r.published);
  const claimed = rows.filter((r) => r.claimed_at).length;
  const noGoogle = rows.filter((r) => !r.google_menu_link).length;
  const stale = hydrated ? rows.filter((r) => daysSince(r.verified_at) > STALE_DAYS).length : 0;
  const tiles = [
    { label: "Live restaurants", value: rows.length.toString(), sub: `${overview.restaurants.length - rows.length} hidden` },
    { label: "Claimed", value: rows.length ? `${Math.round((claimed / rows.length) * 100)}%` : "—", sub: `${claimed} of ${rows.length}` },
    { label: "No menu link on Google", value: noGoogle.toString(), sub: "outreach targets" },
    { label: "Needs re-verify", value: hydrated ? stale.toString() : "–", sub: `verified > ${STALE_DAYS} days ago` },
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t, i) => (
        <div key={t.label} className="animate-rise rounded-[22px] bg-surface p-4 ring-1 ring-line" style={{ animationDelay: `${i * 50}ms` }}>
          <p className="text-[12.5px] font-medium text-ink-3">{t.label}</p>
          <p className="tabular mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em]">{t.value}</p>
          <p className="mt-1.5 text-[12px] text-ink-3">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}

function Pipeline({ rows, hydrated }: { rows: Row[]; hydrated: boolean }) {
  const toast = useToast();
  const { run, busy } = useAction();
  const [tab, setTab] = useState<Tab>("all");
  const sorted = useMemo(
    () =>
      rows
        .map((r) => ({ r, age: hydrated ? daysSince(r.verified_at) : null }))
        .sort(
          (a, b) =>
            Number(!a.r.published) - Number(!b.r.published) ||
            Number(!!a.r.claimed_at) - Number(!!b.r.claimed_at) ||
            b.r.stats.views30d - a.r.stats.views30d,
        ),
    [rows, hydrated],
  );
  const filters: Record<Tab, (x: (typeof sorted)[number]) => boolean> = {
    all: () => true,
    unclaimed: ({ r }) => r.published && !r.claimed_at,
    "no-google": ({ r }) => r.published && !r.google_menu_link,
    stale: ({ r, age }) => r.published && (age ?? 0) > STALE_DAYS,
    hidden: ({ r }) => !r.published,
  };
  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unclaimed", label: "Unclaimed" },
    { id: "no-google", label: "No Google link" },
    { id: "stale", label: "Needs re-verify" },
    { id: "hidden", label: "Hidden" },
  ];
  const visible = sorted.filter(filters[tab]);

  return (
    <section className="mt-5">
      <div role="tablist" className="no-scrollbar -mx-5 flex gap-1 overflow-x-auto px-5">
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
              {t.label} <span className="tabular opacity-60">{sorted.filter(filters[t.id]).length}</span>
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
            className={cn(
              "grid gap-3 border-b border-line p-4 last:border-0 md:grid-cols-[minmax(0,1.6fr)_1fr_1fr_0.7fr_auto] md:items-center md:gap-5",
              !r.published && "bg-surface-2/50",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <Photo id={r.cover ?? undefined} alt="" width={80} className={cn("size-11 shrink-0 rounded-xl", !r.published && "opacity-50")} iconSize={16} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-[14.5px] font-semibold">
                  {r.name}
                  {r.claimed_at && <BadgeCheck className="size-4 shrink-0 fill-accent text-bg" strokeWidth={2} />}
                  {!r.published && (
                    <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-3">Hidden</span>
                  )}
                </p>
                <p className="truncate text-[12.5px] text-ink-3">
                  {sourceLabel[r.source]} · {r.item_count} dishes
                  {age !== null && <span className={cn(age > STALE_DAYS && "font-medium text-warning")}> · verified {age}d ago</span>}
                </p>
              </div>
            </div>
            <Status ok={!!r.claimed_at} okLabel="Claimed" badLabel="Unclaimed" neutral />
            <Status ok={r.google_menu_link} okLabel="On Google" badLabel="No Google link" />
            <p className="tabular text-[14px] font-medium md:text-right">
              {r.stats.views30d.toLocaleString()} <span className="font-normal text-ink-3">views</span>
            </p>
            <div className="flex gap-2">
              {r.published && !r.claimed_at && (
                <button
                  onClick={async () => {
                    await navigator.clipboard?.writeText(pitch(r, location.origin)).catch(() => {});
                    toast("Pitch copied — paste into DM or email");
                  }}
                  className="pressable flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12.5px] font-semibold text-bg"
                >
                  <Copy className="size-3.5" strokeWidth={2.2} /> Pitch
                </button>
              )}
              <IconLink href={`/ops/edit/${r.slug}`} label={`Edit ${r.name}`} icon={Pencil} />
              {r.published ? (
                <IconLink href={`/r/${r.slug}`} label={`Open ${r.name}`} icon={ExternalLink} />
              ) : (
                <button
                  onClick={() => run(`pub:${r.slug}`, () => setPublished(r.slug, true), `${r.name} is live again`)}
                  disabled={busy === `pub:${r.slug}`}
                  className="pressable flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[12.5px] font-semibold text-ink"
                >
                  {busy === `pub:${r.slug}` ? <Loader2 className="size-3.5 animate-spin" /> : "Publish"}
                </button>
              )}
            </div>
          </li>
        ))}
        {visible.length === 0 && <li className="p-10 text-center text-[14px] text-ink-3">Nothing here. Nice.</li>}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink-3">
        <Clock className="size-3.5" /> Re-verify menus older than {STALE_DAYS} days before outreach.
      </p>
    </section>
  );
}

function Claims({ claims, hydrated }: { claims: ClaimRow[]; hydrated: boolean }) {
  const { run, busy } = useAction();
  const pending = claims.filter((c) => c.status === "pending");
  const done = claims.filter((c) => c.status !== "pending");
  return (
    <section className="mt-5 space-y-6">
      <div>
        <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-3">Waiting for verification</h2>
        {pending.length === 0 ? (
          <Empty text="No claims waiting. When an owner claims a page, it shows up here." />
        ) : (
          <ul className="space-y-3">
            {pending.map((c) => (
              <li key={c.id} className="rounded-[22px] bg-surface p-4 ring-1 ring-line">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold">{c.restaurant}</p>
                    <p className="mt-0.5 text-[13.5px] text-ink-2">
                      {c.name} · {c.role} · via {c.method}
                      {c.google_opt_in && " · wants Google menu link"}
                      {hydrated && <span className="text-ink-3"> · {timeAgo(c.created_at)}</span>}
                    </p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="pressable flex h-9 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-[12.5px] font-semibold"
                  >
                    <Phone className="size-3.5" strokeWidth={2.2} /> {formatPhone(c.phone)}
                  </a>
                </div>
                <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-ink-2">
                  Call the number on the restaurant&apos;s Google listing (not a number the claimant gave you) and confirm{" "}
                  {c.name} manages {c.restaurant}.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => run(`a:${c.id}`, () => reviewClaim(c.id, c.slug, true), `${c.restaurant} verified`)}
                    disabled={!!busy}
                    className="pressable flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-positive text-[13.5px] font-semibold text-white disabled:opacity-50 sm:flex-none sm:px-5"
                  >
                    {busy === `a:${c.id}` ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={2.6} />} Approve
                  </button>
                  <button
                    onClick={() => run(`r:${c.id}`, () => reviewClaim(c.id, c.slug, false), "Claim rejected")}
                    disabled={!!busy}
                    className="pressable flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-surface-2 text-[13.5px] font-semibold text-ink disabled:opacity-50 sm:flex-none sm:px-5"
                  >
                    {busy === `r:${c.id}` ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" strokeWidth={2.6} />} Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {done.length > 0 && (
        <div>
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-3">Reviewed</h2>
          <ul className="overflow-hidden rounded-[22px] bg-surface ring-1 ring-line">
            {done.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-[13.5px] last:border-0">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{c.restaurant}</span> <span className="text-ink-3">· {c.name}</span>
                </span>
                <Status ok={c.status === "approved"} okLabel="Approved" badLabel="Rejected" neutral />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Removals({ removals, hydrated }: { removals: RemovalRow[]; hydrated: boolean }) {
  const { run, busy } = useAction();
  const open = removals.filter((r) => r.status === "open");
  return (
    <section className="mt-5 space-y-3">
      {open.length === 0 && <Empty text="No open takedown requests." />}
      {open.map((q) => (
        <div key={q.id} className="rounded-[22px] bg-surface p-4 ring-1 ring-line">
          <p className="text-[15px] font-semibold">{q.restaurant ?? "Unknown restaurant"}</p>
          <p className="mt-0.5 text-[13.5px] text-ink-2">
            {q.name} · {q.contact}
            {hydrated && <span className="text-ink-3"> · {timeAgo(q.created_at)}</span>}
          </p>
          {q.reason && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-2 px-3 py-2 text-[13px] text-ink-2">{q.reason}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => run(`rm:${q.id}`, () => resolveRemoval(q.id, q.slug, true), "Page hidden")}
              disabled={!!busy}
              className="pressable flex h-10 items-center gap-1.5 rounded-full bg-danger px-5 text-[13.5px] font-semibold text-white disabled:opacity-50"
            >
              {busy === `rm:${q.id}` ? <Loader2 className="size-4 animate-spin" /> : <EyeOff className="size-4" strokeWidth={2.2} />} Hide page
            </button>
            <button
              onClick={() => run(`d:${q.id}`, () => resolveRemoval(q.id, q.slug, false), "Request dismissed")}
              disabled={!!busy}
              className="pressable h-10 rounded-full bg-surface-2 px-5 text-[13.5px] font-semibold disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
      {removals.length > open.length && (
        <p className="text-[12.5px] text-ink-3">{removals.length - open.length} resolved request(s).</p>
      )}
    </section>
  );
}

function IconLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Pencil }) {
  return (
    <Link href={href} aria-label={label} className="pressable grid size-9 place-items-center rounded-full bg-surface-2 text-ink-2 hover:text-ink">
      <Icon className="size-4" strokeWidth={2} />
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-[22px] bg-surface p-8 text-center text-[14px] text-ink-3 ring-1 ring-line">{text}</p>;
}

function Status({ ok, okLabel, badLabel, neutral }: { ok: boolean; okLabel: string; badLabel: string; neutral?: boolean }) {
  const Icon = ok ? CheckCircle2 : AlertTriangle;
  return (
    <span className={cn("flex items-center gap-1.5 text-[13px] font-medium", ok ? "text-positive" : neutral ? "text-ink-3" : "text-warning")}>
      <Icon className="size-4" strokeWidth={2.2} /> {ok ? okLabel : badLabel}
    </span>
  );
}
