"use client";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/format";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Swaps its content when `id` changes: the old value slides up and blurs out while the new one rises in. */
export function Swap({ id, children, className, dir = 1 }: { id: React.Key; children: React.ReactNode; className?: string; dir?: 1 | -1 }) {
  return (
    <span className={cn("relative inline-grid", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={id}
          className="col-start-1 row-start-1 inline-block"
          initial={{ opacity: 0, y: 8 * dir, scale: 0.94, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -8 * dir, scale: 0.94, filter: "blur(4px)" }}
          transition={{ duration: 0.22, ease: EASE }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
