"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  Loader2,
  Mail,
  MessageSquareText,
  Pencil,
  QrCode,
  ShieldCheck,
  Store,
  TimerOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkline } from "@/components/dashboard/area-chart";
import { Logo } from "@/components/logo";
import { Photo } from "@/components/photo";
import { Button, Switch } from "@/components/ui";
import { accentStyle } from "@/lib/accent";
import { cn } from "@/lib/format";
import { menuActions, useOverrides } from "@/lib/store";
import type { Restaurant } from "@/lib/types";
import { OtpInput } from "./otp-input";

type Step = "pitch" | "method" | "code" | "details" | "done";
const STEPS: Step[] = ["pitch", "method", "code", "details", "done"];
type Method = "phone" | "email" | "google";

export function ClaimFlow({ restaurant: r }: { restaurant: Restaurant }) {
  const style = useMemo(() => accentStyle(r.accent), [r.accent]);
  const [step, setStep] = useState<Step>("pitch");
  const [dir, setDir] = useState(1);
  const [method, setMethod] = useState<Method>("phone");
  const live = useOverrides(r.slug);
  const [name, setName] = useState("");

  const go = (next: Step) => {
    setDir(STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1);
    setStep(next);
    window.scrollTo({ top: 0 });
  };
  const back = () => go(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);
  const progress = STEPS.indexOf(step) / (STEPS.length - 1);

  // Server data can be a few minutes old, so also trust the live claim state.
  const claimedByOther = r.claimed || (live.claimed && !live.isOwner);
  if (claimedByOther && step !== "done") return <AlreadyClaimed restaurant={r} style={style} />;

  return (
    <div data-accent style={style} className="min-h-dvh bg-bg">
      <header className="mx-auto flex h-16 max-w-lg items-center gap-3 px-5">
        {step !== "pitch" && step !== "done" ? (
          <button onClick={back} aria-label="Back" className="pressable -ml-2 grid size-10 place-items-center rounded-full hover:bg-surface-2">
            <ArrowLeft className="size-5" strokeWidth={2.2} />
          </button>
        ) : (
          <Logo />
        )}
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
          <motion.div
            className="h-full rounded-full bg-accent"
            initial={false}
            animate={{ width: `${Math.max(progress, 0.06) * 100}%` }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-lg overflow-hidden px-5 pb-16">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 28 * d }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -28 * d, transition: { duration: 0.14 } }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", bounce: 0.1, duration: 0.45 }}
          >
            {step === "pitch" && <Pitch restaurant={r} onNext={() => go("method")} />}
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
                  go("done");
                }}
              />
            )}
            {step === "done" && <Done restaurant={r} name={name} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function StepTitle({ eyebrow, title, sub }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="pt-6">
      {eyebrow && <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-accent">{eyebrow}</p>}
      <h1 className="mt-2 font-display text-[34px] leading-[1.05] tracking-[-0.02em] text-ink [font-variation-settings:'opsz'_60]">
        {title}
      </h1>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{sub}</p>}
    </div>
  );
}

const BENEFITS = [
  { icon: Pencil, title: "Fix prices in seconds", body: "Edit any dish from your phone. Changes go live instantly." },
  { icon: TimerOff, title: "Mark dishes sold out", body: "Stop the “sorry, we're out” conversation at the table." },
  { icon: QrCode, title: "Free table QR codes", body: "Print-ready codes that always point to your latest menu." },
  { icon: BarChart3, title: "See what diners look at", body: "Views, top dishes, and where your guests come from." },
];

function Pitch({ restaurant: r, onNext }: { restaurant: Restaurant; onNext: () => void }) {
  return (
    <div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-2.5 pr-4 ring-1 ring-line">
        <Photo id={r.cover} alt="" width={96} className="size-14 shrink-0 rounded-xl" iconSize={18} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{r.name}</p>
          <p className="truncate text-[13px] text-ink-3">{r.address}</p>
        </div>
      </div>

      <StepTitle
        title={
          <>
            <span className="tabular text-accent">{r.stats.views30d.toLocaleString()}</span> people looked at your
            menu this month.
          </>
        }
        sub="We built this page from an in-person visit and public photos so guests could find your prices. Claim it to keep it accurate — it's free."
      />

      <div className="mt-5 rounded-2xl bg-surface p-4 ring-1 ring-line">
        <div className="flex items-baseline justify-between text-[12.5px] text-ink-3">
          <span>Views, last 30 days</span>
          <span className={cn("font-medium", r.stats.trendPct >= 0 ? "text-positive" : "text-ink-2")}>
            {r.stats.trendPct >= 0 ? "↑" : "↓"} {Math.abs(r.stats.trendPct)}% in 2 weeks
          </span>
        </div>
        <Sparkline data={r.stats.daily} className="mt-2 h-14 w-full" />
      </div>

      <ul className="mt-6 space-y-4">
        {BENEFITS.map((b, i) => (
          <li key={b.title} className="flex animate-rise gap-3.5" style={{ animationDelay: `${120 + i * 60}ms` }}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
              <b.icon className="size-[18px]" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[15px] font-medium text-ink">{b.title}</p>
              <p className="mt-0.5 text-[13.5px] leading-snug text-ink-2">{b.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 -mx-5 mt-8 bg-gradient-to-t from-bg via-bg to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        <Button variant="accent" className="w-full" onClick={onNext}>
          Claim {r.name} — free
        </Button>
        <p className="mt-3 text-center text-[12.5px] text-ink-3">
          Not the owner?{" "}
          <Link href={`/r/${r.slug}`} className="font-medium text-ink-2 underline-offset-2 hover:underline">
            Back to the menu
          </Link>
        </p>
      </div>
    </div>
  );
}

function maskPhone(e164: string) {
  return `(${e164.slice(2, 5)}) •••-${e164.slice(-4)}`;
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
  const options: { id: Method; icon: typeof Mail; title: string; body: string; badge?: string }[] = [
    {
      id: "phone",
      icon: MessageSquareText,
      title: `Text ${maskPhone(r.phone)}`,
      body: "The number listed on your Google Business Profile.",
      badge: "Fastest",
    },
    { id: "email", icon: Mail, title: "Email a business address", body: "Must match your website's domain." },
    { id: "google", icon: Store, title: "Sign in with Google Business", body: "If you already manage the Google listing." },
  ];
  return (
    <div>
      <StepTitle eyebrow="Step 1 of 3" title="Let's make sure it's you" sub="We verify every owner so no one else can edit your menu." />
      <div role="radiogroup" className="mt-6 space-y-2.5">
        {options.map((o) => {
          const on = method === o.id;
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={on}
              onClick={() => setMethod(o.id)}
              className={cn(
                "pressable relative flex w-full items-center gap-3.5 rounded-2xl bg-surface p-4 text-left ring-1",
                on ? "ring-2 ring-accent" : "ring-line hover:ring-line-strong",
              )}
            >
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl transition-colors", on ? "bg-accent text-on-accent" : "bg-surface-2 text-ink-2")}>
                <o.icon className="size-[18px]" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
                  {o.title}
                  {o.badge && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-accent">
                      {o.badge}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[13px] text-ink-3">{o.body}</span>
              </span>
              <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]", on ? "border-accent bg-accent" : "border-line-strong")}>
                <AnimatePresence>
                  {on && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check className="size-3 text-on-accent" strokeWidth={3.5} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </button>
          );
        })}
      </div>
      <Button variant="accent" className="mt-8 w-full" onClick={onNext}>
        {method === "google" ? "Continue with Google" : "Send code"}
      </Button>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-ink-3">
        <ShieldCheck className="size-3.5" strokeWidth={2} /> We never share your contact details.
      </p>
    </div>
  );
}

function CodeStep({ restaurant: r, method, onNext }: { restaurant: Restaurant; method: Method; onNext: () => void }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "error">("idle");
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
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

  const target = method === "phone" ? maskPhone(r.phone) : method === "email" ? "your business email" : "your Google account";
  return (
    <div>
      <StepTitle eyebrow="Step 2 of 3" title="Enter the 6-digit code" sub={<>We sent it to {target}. It expires in 10 minutes.</>} />
      <div className="mt-8">
        <OtpInput
          value={code}
          onChange={onCode}
          error={status === "error"}
          disabled={status === "checking"}
        />
      </div>
      <div className="mt-5 flex h-6 items-center justify-center text-[13.5px]">
        <AnimatePresence mode="wait">
          {status === "checking" ? (
            <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-ink-2">
              <Loader2 className="size-4 animate-spin" /> Verifying…
            </motion.span>
          ) : status === "error" ? (
            <motion.span key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-danger">
              That code didn&apos;t work. Try again.
            </motion.span>
          ) : resendIn > 0 ? (
            <motion.span key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tabular text-ink-3">
              Resend code in 0:{String(resendIn).padStart(2, "0")}
            </motion.span>
          ) : (
            <motion.button key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setResendIn(30)} className="font-medium text-accent">
              Resend code
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-10 rounded-2xl bg-surface-2 px-4 py-3 text-center text-[12.5px] text-ink-3">
        Demo: any 6 digits verify. <span className="tabular">000000</span> shows the error state.
      </p>
    </div>
  );
}

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
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPending(false);
    }
  };
  return (
    <div>
      <StepTitle eyebrow="Step 3 of 3" title="Almost done" sub="Tell us who's managing the page." />
      <label className="mt-6 block">
        <span className="text-[13px] font-medium text-ink-2">Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          autoComplete="name"
          placeholder="e.g. Lucia Romano"
          className="mt-1.5 h-12 w-full rounded-2xl bg-surface px-4 text-[16px] text-ink ring-1 ring-line-strong outline-none transition-shadow placeholder:text-ink-3 focus:ring-2 focus:ring-accent"
        />
      </label>
      <div className="mt-5">
        <span className="text-[13px] font-medium text-ink-2">Your role</span>
        <div className="mt-1.5 inline-flex w-full rounded-2xl bg-surface-2 p-1">
          {ROLES.map((x) => (
            <button
              key={x}
              onClick={() => setRole(x)}
              aria-pressed={role === x}
              className={cn("relative h-10 flex-1 rounded-xl text-[14px] font-medium transition-colors", role === x ? "text-ink" : "text-ink-3")}
            >
              {role === x && <motion.span layoutId="role" className="absolute inset-0 rounded-xl bg-surface shadow-sm" />}
              <span className="relative">{x}</span>
            </button>
          ))}
        </div>
      </div>

      {!r.googleMenuLink && (
        <div className="mt-6 flex gap-3.5 rounded-2xl bg-surface p-4 ring-1 ring-line">
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-medium text-ink">Add this menu to your Google listing</p>
            <p className="mt-1 text-[13px] leading-snug text-ink-3">
              Your Google Business Profile has no menu link yet. We&apos;ll add it for you — you can remove it
              anytime.
            </p>
          </div>
          <Switch checked={google} onChange={setGoogle} label="Add menu link to Google" />
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-6 rounded-2xl bg-danger/10 px-4 py-3 text-[13.5px] text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <Button variant="accent" className="mt-8 w-full" disabled={!name.trim() || pending} onClick={finish}>
        {pending ? <Loader2 className="size-5 animate-spin" /> : "Finish setup"}
      </Button>
    </div>
  );
}

function Done({ restaurant: r, name }: { restaurant: Restaurant; name: string }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center pt-16 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
        className="relative grid size-20 place-items-center rounded-full bg-accent text-on-accent shadow-lg"
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-accent"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
        />
        <svg viewBox="0 0 24 24" className="relative size-9" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }} />
        </svg>
      </motion.div>
      <h1 className="mt-8 font-display text-[36px] leading-tight tracking-[-0.02em] [font-variation-settings:'opsz'_60]">
        You&apos;re in{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}.
      </h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">
        {r.name} is now verified. Guests will see a checkmark, and you can update the menu anytime.
      </p>
      <div className="mt-8 flex w-full flex-col gap-2.5">
        <Button variant="accent" onClick={() => router.push(`/dashboard/${r.slug}`)}>
          Open your dashboard
        </Button>
        <Button variant="secondary" onClick={() => router.push(`/r/${r.slug}`)}>
          View your menu page
        </Button>
      </div>
    </div>
  );
}

function AlreadyClaimed({ restaurant: r, style }: { restaurant: Restaurant; style: React.CSSProperties }) {
  return (
    <div data-accent style={style} className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div className="max-w-sm animate-rise">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <ShieldCheck className="size-6" strokeWidth={2} />
        </div>
        <h1 className="mt-6 font-display text-[32px] leading-tight tracking-[-0.02em]">{r.name} is already claimed</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          If you work there and need access, ask the current manager to invite you, or contact support.
        </p>
        <div className="mt-8 flex flex-col gap-2.5">
          <Link href={`/dashboard/${r.slug}`} className="pressable inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-[15px] font-semibold text-on-accent">
            Open dashboard (demo)
          </Link>
          <Link href={`/r/${r.slug}`} className="pressable inline-flex h-12 items-center justify-center rounded-full bg-surface-2 px-6 text-[15px] font-semibold">
            Back to menu
          </Link>
        </div>
      </div>
    </div>
  );
}
