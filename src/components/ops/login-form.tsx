"use client";

import { AnimatePresence, motion } from "motion/react";
import { KeyRound, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { signIn } from "@/app/ops/actions";
import { LogoMark } from "@/components/logo";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <form action={action} className="w-full max-w-sm animate-rise">
        <LogoMark className="size-10" />
        <h1 className="mt-6 text-3xl leading-tight">
          nomm ops
        </h1>
        <p className="mt-2 text-base text-ink-2">Enter the admin key to manage restaurants, claims, and takedowns.</p>
        <input type="hidden" name="next" value={next} />
        <motion.label
          animate={state.error ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 flex h-12 items-center gap-2.5 rounded-2xl bg-surface px-4 ring-1 ring-line-strong focus-within:ring-2 focus-within:ring-brand"
        >
          <KeyRound className="size-4 text-ink-3" strokeWidth={2.2} />
          <input
            name="token"
            type="password"
            autoFocus
            autoComplete="current-password"
            placeholder="Admin key"
            aria-label="Admin key"
            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
          />
        </motion.label>
        <AnimatePresence>
          {state.error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 text-sm text-danger"
            >
              {state.error}
            </motion.p>
          )}
        </AnimatePresence>
        <button
          disabled={pending}
          className="pressable mt-5 flex h-12 w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-bg disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : "Sign in"}
        </button>
      </form>
    </main>
  );
}
