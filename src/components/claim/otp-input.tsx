"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/format";

/** Six boxes backed by one real input, so paste and SMS autofill just work. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  error,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <motion.div
      animate={error ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
      onClick={() => input.current?.focus()}
    >
      <input
        ref={input}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        disabled={disabled}
        aria-label="Verification code"
        className="peer absolute inset-0 z-10 w-full cursor-default opacity-0"
      />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length }, (_, i) => {
          const char = value[i];
          const current = i === Math.min(value.length, length - 1);
          return (
            <div
              key={i}
              className={cn(
                "relative grid aspect-[4/5] place-items-center rounded-2xl bg-surface text-[26px] font-semibold ring-1 transition-[box-shadow,--tw-ring-color] duration-150",
                error ? "ring-danger" : current ? "ring-2 ring-accent peer-focus:ring-accent" : "ring-line-strong",
              )}
            >
              {char ? (
                <motion.span
                  key={char + i}
                  initial={{ scale: 0.5, opacity: 0, y: 6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.45, duration: 0.35 }}
                  className="tabular"
                >
                  {char}
                </motion.span>
              ) : (
                current &&
                !disabled && <span className="h-7 w-0.5 animate-[fade_1s_ease-in-out_infinite_alternate] rounded-full bg-accent" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
