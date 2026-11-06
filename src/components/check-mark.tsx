"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/format";

/** Round "done" badge whose tick draws itself in. Only mounted after an action, so it never appears in server HTML. */
export function CheckMark({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className={cn("grid size-16 place-items-center rounded-full bg-fresh-soft text-fresh", className)}
      initial={reduce ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.35, duration: 0.5 }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="size-1/2">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.12, duration: 0.35, ease: "easeOut" }}
        />
      </svg>
    </motion.span>
  );
}
