"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { dietIcon } from "@/components/icons";
import { cn, dietLabel } from "@/lib/format";
import type { DietTag } from "@/lib/types";

export type Filter = DietTag | "popular";

const ORDER: Filter[] = ["popular", "vegetarian", "vegan", "gluten-free", "spicy"];

export function FilterChips({
  available,
  active,
  onToggle,
  className,
}: {
  available: Set<Filter>;
  active: Filter[];
  onToggle: (f: Filter) => void;
  className?: string;
}) {
  const chips = ORDER.filter((f) => available.has(f));
  if (!chips.length) return null;
  return (
    <div className={cn("no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5", className)}>
      {chips.map((f) => {
        const on = active.includes(f);
        const Icon = f === "popular" ? Sparkles : dietIcon[f];
        return (
          <button
            key={f}
            onClick={() => onToggle(f)}
            aria-pressed={on}
            className={cn(
              "pressable flex h-8 shrink-0 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-[13px] font-medium",
              on
                ? "bg-accent text-on-accent shadow-sm"
                : "bg-surface text-ink-2 ring-1 ring-line hover:text-ink hover:ring-line-strong",
            )}
          >
            <span className="relative grid size-3.5 place-items-center">
              <AnimatePresence initial={false} mode="popLayout">
                {on ? (
                  <motion.span
                    key="on"
                    initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                  >
                    <Check className="size-3.5" strokeWidth={2.8} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="off"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                  >
                    <Icon className="size-3.5" strokeWidth={2.2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {f === "popular" ? "Popular" : dietLabel[f]}
          </button>
        );
      })}
    </div>
  );
}
