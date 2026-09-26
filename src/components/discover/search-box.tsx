"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/format";

/** Large search field whose placeholder cycles through example queries. */
export function SearchBox({
  value,
  onChange,
  examples,
  label,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  examples: string[];
  label: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [i, setI] = useState(0);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (value || examples.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % examples.length), 2600);
    return () => clearInterval(t);
  }, [value, examples.length]);

  return (
    <label
      className={cn(
        "relative flex h-14 items-center gap-3 rounded-[20px] bg-surface px-4 shadow-md ring-1 transition-[box-shadow,--tw-ring-color] duration-300",
        focused ? "ring-2 ring-brand" : "ring-line",
        className,
      )}
    >
      <Search className="size-5 shrink-0 text-ink-3" strokeWidth={2.2} />
      <div className="relative h-full min-w-0 flex-1">
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          enterKeyHint="search"
          autoComplete="off"
          className="peer absolute inset-0 bg-transparent text-[16px] text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {!value && (
          <div className="pointer-events-none absolute inset-0 flex items-center overflow-hidden text-[16px] text-ink-3">
            <span className="mr-1.5 shrink-0">Try</span>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={examples[i]}
                initial={{ y: 18, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -18, opacity: 0, filter: "blur(4px)" }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.55 }}
                className="truncate text-ink-2"
              >
                &ldquo;{examples[i]}&rdquo;
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>
      <AnimatePresence>
        {value && (
          <motion.button
            type="button"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="grid size-6 place-items-center rounded-full bg-surface-3 text-ink-2 hover:text-ink"
          >
            <X className="size-3.5" strokeWidth={2.6} />
          </motion.button>
        )}
      </AnimatePresence>
    </label>
  );
}
