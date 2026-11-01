"use client";

import { ChevronUp, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "@/i18n/client";
import { formatAmount } from "@/i18n/format";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Floating "View bag" bar, shown once something is in the bag. Count and total crossfade as they change. */
export function BagBar({ count, total, currency, onOpen }: { count: number; total: number; currency: string; onOpen: () => void }) {
  const { t, locale, currency: cur } = useI18n();
  const amount = locale === "ar" ? `${formatAmount(total)} ${cur(currency)}` : `${cur(currency)} ${formatAmount(total)}`;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))] md:justify-end md:px-8 md:pb-8">
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key="bag"
            initial={{ opacity: 0, y: 8, scale: 0.98, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
            transition={{ duration: 0.22, ease: EASE }}
            className="pointer-events-auto w-full max-w-sm md:w-auto"
          >
            <motion.button
              type="button"
              onClick={onOpen}
              whileTap={{ scale: 0.97 }}
              className="flex h-14 w-full items-center gap-3 rounded-full bg-plum/[0.98] ps-2 pe-5 text-white shadow-bag backdrop-blur-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum focus-visible:ring-offset-2 md:min-w-[300px]"
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <ShoppingBag className="h-5 w-5" aria-hidden />
                <span className="absolute -end-1 -top-1 grid h-5 min-w-[20px] items-center justify-center overflow-hidden rounded-full bg-tomato px-1 text-[11px] font-bold">
                  <AnimatePresence initial={false}>
                    <motion.span
                      key={count}
                      className="col-start-1 row-start-1"
                      initial={{ opacity: 0, filter: "blur(3px)", scale: 0.9 }}
                      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                      exit={{ opacity: 0, filter: "blur(3px)", scale: 1.05 }}
                      transition={{ duration: 0.18, ease: EASE }}
                    >
                      {count}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
              <span className="flex-1 text-start text-[15px] font-semibold">{t.bag.view}</span>
              <span className="grid min-w-[88px] text-end text-[15px] font-semibold tabular-nums" aria-live="polite" aria-atomic="true">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={total}
                    className="col-start-1 row-start-1"
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.18, ease: EASE }}
                  >
                    {amount}
                  </motion.span>
                </AnimatePresence>
              </span>
              <ChevronUp className="h-4 w-4 opacity-70" aria-hidden />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
