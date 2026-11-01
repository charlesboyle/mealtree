"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Loader2, Mail, MessageSquareText, ShieldCheck, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { Sparkline } from "@/components/dashboard/area-chart";
import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import { RestaurantThumb } from "@/components/photo";
import { Button, Switch } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { maskPhone } from "@/i18n/format";
import { cn } from "@/lib/format";
import { actionErrorMessage, menuActions, useOverrides } from "@/lib/store";
import type { Restaurant, RestaurantStats } from "@/lib/types";
import { OtpInput } from "./otp-input";

type Step = "pitch" | "method" | "code" | "details" | "done";
const STEPS: Step[] = ["pitch", "method", "code", "details", "done"];
type Method = "phone" | "email" | "google";

/** Keeps a phone number in LTR order inside Arabic sentences. */
const isolate = (s: string) => `⁨${s}⁩`;

export function ClaimFlow({ restaurant: r, stats }: { restaurant: Restaurant; stats: RestaurantStats }) {
  const { t, dir: textDir } = useI18n();
  const [step, setStep] = useState<Step>("pitch");
  const [dir, setDir] = useState(1);
  const [method, setMethod] = useState<Method>("phone");
  const live = useOverrides(r.slug);
  const [name, setName] = useState("");
  // Steps slide in from the reading direction's "forward" side.
  const sign = textDir === "rtl" ? -1 : 1;

  const go = (next: Step) => {
    setDir(STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0 });
  };
  const back = () => go(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);
  const progress = STEPS.indexOf(step) / (STEPS.length - 1);

  // Server data can be a few minutes old, so also trust the live claim state.
  const claimedByOther = r.claimed || (live.claimed && !live.isOwner);
  if (step !== "done") {
    if (live.pendingReview) return <AlreadyClaimed restaurant={r} pending />;
    if (claimedByOther && !live.isOwner) return <AlreadyClaimed restaurant={r} />;
  }

  return (
    <div className="min-h-dvh bg-cream">
      <header className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4 sm:px-6">
        {step !== "pitch" && step !== "done" ? (
          <button
            onClick={back}
            aria-label={t.common.back}
            className="-ms-2 grid size-10 place-items-center rounded-full text-plum transition-[background-color,transform] duration-150 hover:bg-soft active:scale-90"
          >
            <ArrowLeft className="size-5 rtl:-scale-x-100" strokeWidth={2} />
          </button>
        ) : (
          <Logo />
        )}
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-tomato"
            initial={false}
            animate={{ width: `${Math.max(progress, 0.06) * 100}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          />
        </div>
        <LanguageToggle className="-me-2" />
      </header>

      <main className="mx-auto max-w-2xl overflow-hidden px-4 pb-16 sm:px-6">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 20 * d * sign }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -20 * d * sign, transition: { duration: 0.12 } }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          >
            {step === "pitch" && <Pitch restaurant={r} stats={stats} onNext={() => go("method")} />}
            {step === "method" && (
              <MethodStep restaurant={r} method={method} setMethod={setMethod} onNext={() => go("code")} />
            )}
            {step === "code" && <CodeStep restaurant={r} method={method} onNext={() => go("details")} />}
            {step === "details" && (
              <DetailsStep
                restaurant={r}
                name={name}
                setName={setName}
                onNext={async (googleOptIn, role) => {
                  await menuActions.claim(r.slug, { name: name.trim(), role, method, googleOptIn });
                  posthog.capture("restaurant_claim_submitted", {
                    restaurant_slug: r.slug,
                    verification_method: method,
                    claimant_role: role,
                    google_menu_link_requested: googleOptIn,
                  });
                  go("done");
                }}
              />
            )}
            {step === "done" && <Done restaurant={r} name={name} pending={live.pendingReview} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function StepTitle({ eyebrow, title, sub }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="pt-6">
      {eyebrow && <p className="text-sm font-medium text-tomato">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-plum sm:text-3xl">{title}</h1>
      {sub && <p className="mt-3 text-base leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

function Pitch({
  restaurant: r,
  stats,
  onNext,
}: {
  restaurant: Restaurant;
  stats: RestaurantStats;
  onNext: () => void;
}) {
  const { t, pick, href, number } = useI18n();
  const name = pick(r.name, r.nameAr);
  return (
    <div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-paper p-3">
        <RestaurantThumb restaurant={r} className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-plum">{name}</p>
          <p className="truncate text-sm text-muted">{pick(r.address, r.addressAr)}</p>
        </div>
      </div>

      <StepTitle
        title={stats.views30d > 0 ? t.claim.viewsTitle(number(stats.views30d)) : t.claim.liveTitle}
        sub={t.claim.pitchSub(t.source[r.source])}
      />

      {stats.views30d > 0 && (
        <div className="mt-6 rounded-2xl bg-paper p-4">
          <div className="flex items-baseline justify-between gap-3 text-sm text-muted">
            <span>{t.claim.views30}</span>
            {stats.trendPct !== null && (
              <span className={cn("font-medium", stats.trendPct >= 0 ? "text-positive" : "text-ink-2")}>
                {t.claim.trend(stats.trendPct)}
              </span>
            )}
          </div>
          <Sparkline data={stats.daily} className="mt-3 h-12 w-full" />
        </div>
      )}

      <ul className="mt-6 divide-y divide-line rounded-2xl bg-white px-4 shadow-card">
        {t.claim.benefits.map((b) => (
          <li key={b.title} className="flex gap-3 py-3.5">
            <Check className="mt-0.5 size-4.5 shrink-0 text-fresh" strokeWidth={2.4} />
            <div>
              <p className="text-base font-semibold text-plum">{b.title}</p>
              <p className="mt-0.5 text-sm text-muted">{b.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 -mx-4 mt-6 bg-cream px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <Button variant="accent" className={cn(BTN, "w-full")} onClick={onNext}>
          {t.claim.cta(name)}
        </Button>
        <p className="mt-3 text-center text-sm text-muted">
          {t.claim.free} {t.claim.notOwner}{" "}
          <Link href={href(`/r/${r.slug}`)} className="font-medium text-plum underline underline-offset-2">
            {t.claim.backToMenu}
          </Link>
        </p>
      </div>
    </div>
  );
}

function MethodStep({
  restaurant: r,
  method,
  setMethod,
  onNext,
}: {
  restaurant: Restaurant;
  method: Method;
  setMethod: (m: Method) => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  const options: { id: Method; icon: typeof Mail; title: string; body: string; badge?: string }[] = [
    {
      id: "phone",
      icon: MessageSquareText,
      title: t.claim.methodPhone(isolate(maskPhone(r.phone))),
      body: t.claim.methodPhoneBody,
      badge: t.claim.fastest,
    },
    { id: "email", icon: Mail, title: t.claim.methodEmail, body: t.claim.methodEmailBody },
    { id: "google", icon: Store, title: t.claim.methodGoogle, body: t.claim.methodGoogleBody },
  ];
  return (
    <div>
      <StepTitle eyebrow={t.claim.step(1, 3)} title={t.claim.verifyTitle} sub={t.claim.verifySub} />
      <div role="radiogroup" className="mt-6 space-y-2">
        {options.map((o) => {
          const on = method === o.id;
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={on}
              onClick={() => setMethod(o.id)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-2xl border p-4 text-start transition-[background-color,border-color,transform] duration-150 active:scale-[0.99]",
                on ? "border-tomato bg-tomato/[0.06]" : "border-line bg-white hover:bg-soft",
              )}
            >
              <o.icon className={cn("size-5 shrink-0", on ? "text-tomato" : "text-muted")} strokeWidth={1.9} />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 text-base font-semibold text-plum">
                  {o.title}
                  {o.badge && <span className="text-xs font-medium text-fresh">{o.badge}</span>}
                </span>
                <span className="mt-0.5 block text-sm text-muted">{o.body}</span>
              </span>
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]",
                  on ? "border-tomato bg-tomato" : "border-line",
                )}
              >
                {on && <Check className="size-3 text-white" strokeWidth={3.5} />}
              </span>
            </button>
          );
        })}
      </div>
      <Button variant="accent" className={cn(BTN, "mt-8 w-full")} onClick={onNext}>
        {method === "google" ? t.claim.continueGoogle : t.claim.sendCode}
      </Button>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted">
        <ShieldCheck className="size-4" strokeWidth={2} /> {t.claim.privacyNote}
      </p>
    </div>
  );
}

function CodeStep({ restaurant: r, method, onNext }: { restaurant: Restaurant; method: Method; onNext: () => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onCode = (v: string) => {
    setCode(v);
    setStatus("idle");
    if (v.length !== 6) return;
    setStatus("checking");
    // Demo: any code except 000000 verifies.
    timer.current = setTimeout(() => {
      if (v === "000000") {
        setStatus("error");
        setCode("");
      } else onNext();
    }, 900);
  };

  const target =
    method === "phone"
      ? isolate(maskPhone(r.phone))
      : method === "email"
        ? t.claim.codeTargetEmail
        : t.claim.codeTargetGoogle;
  return (
    <div>
      <StepTitle eyebrow={t.claim.step(2, 3)} title={t.claim.codeTitle} sub={t.claim.codeSub(target)} />
      <div className="mt-8">
        <OtpInput
          value={code}
          onChange={onCode}
          error={status === "error"}
          disabled={status === "checking"}
          label={t.claim.codeLabel}
        />
      </div>
      <div className="mt-5 flex h-6 items-center justify-center text-sm">
        {status === "checking" ? (
          <span className="flex animate-fade items-center gap-2 text-muted">
            <Loader2 className="size-4 animate-spin" /> {t.claim.verifying}
          </span>
        ) : status === "error" ? (
          <span className="animate-fade text-danger">{t.claim.codeError}</span>
        ) : resendIn > 0 ? (
          <span className="tabular text-muted">{t.claim.resendIn(`0:${String(resendIn).padStart(2, "0")}`)}</span>
        ) : (
          <button onClick={() => setResendIn(30)} className="font-medium text-tomato transition-opacity active:opacity-60">
            {t.claim.resend}
          </button>
        )}
      </div>
      <p className="mt-10 rounded-2xl bg-paper px-4 py-3 text-center text-xs text-muted">{t.claim.demoNote}</p>
    </div>
  );
}

const BTN_BASE = "inline-flex h-12 items-center justify-center rounded-full px-6 text-base font-semibold";
const BTN =
  "!bg-tomato !text-white shadow-card transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.98]";
const BTN_SECONDARY =
  "!bg-plum/[0.05] !text-plum transition-[background-color,transform] duration-150 hover:!bg-plum/[0.09] active:scale-[0.98]";

const ROLES = ["Owner", "Manager", "Staff"];

function DetailsStep({
  restaurant: r,
  name,
  setName,
  onNext,
}: {
  restaurant: Restaurant;
  name: string;
  setName: (v: string) => void;
  onNext: (googleLink: boolean, role: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [role, setRole] = useState("Owner");
  const [google, setGoogle] = useState(!r.googleMenuLink);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finish = async () => {
    setPending(true);
    setError(null);
    try {
      await onNext(google, role);
    } catch (e) {
      setError(actionErrorMessage(e, t));
      setPending(false);
    }
  };
  return (
    <div>
      <StepTitle eyebrow={t.claim.step(3, 3)} title={t.claim.detailsTitle} sub={t.claim.detailsSub} />
      <label className="mt-6 block">
        <span className="text-[13px] font-medium text-plum">{t.claim.yourName}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          autoComplete="name"
          placeholder={t.claim.namePlaceholder}
          className="mt-1.5 h-12 w-full rounded-xl bg-plum/[0.05] px-4 text-[15px] text-plum outline-none transition-colors duration-150 placeholder:text-muted focus:bg-plum/[0.08]"
        />
      </label>
      <div className="mt-5">
        <span className="text-[13px] font-medium text-plum">{t.claim.yourRole}</span>
        <div className="mt-1.5 flex w-full rounded-xl bg-plum/[0.05] p-1">
          {ROLES.map((x) => (
            <button
              key={x}
              onClick={() => setRole(x)}
              aria-pressed={role === x}
              className={cn(
                "relative h-10 flex-1 rounded-lg text-sm font-medium transition-colors",
                role === x ? "text-plum" : "text-muted",
              )}
            >
              {role === x && (
                <motion.span
                  layoutId="role"
                  className="absolute inset-0 rounded-lg bg-white shadow-pill"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
              <span className="relative">{t.claim.roles[x]}</span>
            </button>
          ))}
        </div>
      </div>

      {!r.googleMenuLink && (
        <div className="mt-6 flex gap-4 rounded-2xl bg-paper p-4">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-plum">{t.claim.googleTitle}</p>
            <p className="mt-1 text-sm text-muted">{t.claim.googleBody}</p>
          </div>
          <Switch checked={google} onChange={setGoogle} label={t.claim.googleLabel} />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 animate-fade rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <Button variant="accent" className={cn(BTN, "mt-8 w-full")} disabled={!name.trim() || pending} onClick={finish}>
        {pending ? <Loader2 className="size-5 animate-spin" /> : t.claim.finish}
      </Button>
    </div>
  );
}

function Done({ restaurant: r, name, pending }: { restaurant: Restaurant; name: string; pending: boolean }) {
  const { t, pick, href } = useI18n();
  const router = useRouter();
  const first = name.trim().split(" ")[0] ?? "";
  const rName = pick(r.name, r.nameAr);
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
        className="grid size-16 place-items-center rounded-full bg-fresh text-white"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
      <h1 className="mt-7 text-2xl font-bold tracking-[-0.02em] text-plum sm:text-3xl">
        {pending ? t.claim.thanks(first) : t.claim.youreIn(first)}
      </h1>
      <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
        {pending ? t.claim.pendingBody(isolate(maskPhone(r.phone)), rName) : t.claim.approvedBody(rName)}
      </p>
      <div className="mt-8 flex w-full flex-col gap-2">
        <Button variant="accent" className={BTN} onClick={() => router.push(href(`/dashboard/${r.slug}`))}>
          {pending ? t.claim.previewDashboard : t.claim.openDashboard}
        </Button>
        <Button variant="secondary" className={BTN_SECONDARY} onClick={() => router.push(href(`/r/${r.slug}`))}>
          {t.claim.viewMenu}
        </Button>
      </div>
    </div>
  );
}

function AlreadyClaimed({
  restaurant: r,
  pending,
}: {
  restaurant: Restaurant;
  pending?: boolean;
}) {
  const { t, pick, href } = useI18n();
  const name = pick(r.name, r.nameAr);
  return (
    <div className="grid min-h-dvh place-items-center bg-cream px-6 text-center">
      <div className="max-w-sm animate-rise">
        <ShieldCheck className="mx-auto size-8 text-fresh" strokeWidth={1.8} />
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-plum">
          {pending ? t.claim.pendingTitle : t.claim.claimedTitle(name)}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{pending ? t.claim.pendingAlready(name) : t.claim.claimedBody}</p>
        <div className="mt-8 flex flex-col gap-2">
          <Link
            href={href(`/dashboard/${r.slug}`)}
            className={cn(BTN_BASE, BTN)}
          >
            {pending ? t.claim.previewDashboard : t.claim.viewDashboard}
          </Link>
          <Link
            href={href(`/r/${r.slug}`)}
            className={cn(BTN_BASE, BTN_SECONDARY)}
          >
            {t.claim.backToMenu}
          </Link>
        </div>
      </div>
    </div>
  );
}
