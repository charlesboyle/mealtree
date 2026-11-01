"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/format";

/** Toggle pill used for filters. */
export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.12 }}
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40",
      )}
    >
      {children}
    </motion.button>
  );
}
