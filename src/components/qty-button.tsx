"use client";

import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { useI18n } from "@/i18n/client";

const EASE = [0.23, 1, 0.32, 1] as const;

/**
 * "+" that widens into − n + once the dish is in the bag. A dish with choices only
 * offers "+" (it opens the options); the bag sheet steps it down. Width eases with
 * CSS so the pill grows smoothly instead of springing.
 */
export function QtyButton({ qty, onAdd, onRemove, name, customisable = false }: { qty: number; onAdd: () => void; onRemove: () => void; name: string; customisable?: boolean }) {
  const { t } = useI18n();
  const inBag = qty > 0;
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const width = !inBag ? 36 : customisable ? 64 : 96;

  return (
    <div
      className={`relative flex h-9 shrink-0 items-center overflow-hidden rounded-full transition-[width,background-color,color,box-shadow] duration-200 ${
        inBag ? "bg-plum text-white" : "bg-white text-plum ring-1 ring-inset ring-line hover:ring-plum/40"
      }`}
      style={{ width, transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <AnimatePresence initial={false}>
        {inBag && !customisable && (
          <motion.button
            key="minus"
            type="button"
            onClick={stop(onRemove)}
            aria-label={t.bag.removeOne(name)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="absolute start-0 flex h-9 w-9 items-center justify-center active:scale-90"
          >
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {inBag && (
          <motion.span
            key="count"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: EASE }}
            className={`absolute flex h-9 items-center justify-center overflow-hidden text-sm font-semibold tabular-nums ${customisable ? "start-0 w-7 ps-2" : "start-9 w-6"}`}
            aria-live="polite"
          >
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span key={qty} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.16, ease: EASE }}>
                {qty}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={stop(onAdd)}
        aria-label={customisable ? t.bag.chooseOptions(name) : inBag ? t.bag.addAnother(name) : t.bag.add(name)}
        className="absolute end-0 flex h-9 w-9 items-center justify-center transition-transform duration-100 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tomato"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
