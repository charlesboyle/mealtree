"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Clock, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { OpenStatus, useMinute } from "@/components/open-status";
import { cn, formatPhone, mapsUrl } from "@/lib/format";
import { dayNames, formatRanges, nowIn } from "@/lib/hours";
import type { Hours, Restaurant } from "@/lib/types";

// Monday-first reads more naturally for a weekly schedule.
const WEEK: (keyof Hours)[] = [1, 2, 3, 4, 5, 6, 0];

export function InfoCard({ restaurant: r }: { restaurant: Restaurant }) {
  const [showHours, setShowHours] = useState(false);
  const minute = useMinute();
  const today = minute ? nowIn(r.timezone, new Date(minute * 60000)).day : null;

  return (
    <section aria-label="Hours and location" className="mt-12 overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
      <button
        onClick={() => setShowHours((s) => !s)}
        aria-expanded={showHours}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2/50"
      >
        <Clock className="size-[18px] shrink-0 text-ink-3" strokeWidth={2} />
        <div className="min-w-0 flex-1 text-[14.5px]">
          <OpenStatus hours={r.hours} timezone={r.timezone} />
        </div>
        <motion.span animate={{ rotate: showHours ? 180 : 0 }} className="text-ink-3">
          <ChevronDown className="size-[18px]" strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {showHours && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 px-5 pb-4 pl-[3.25rem] text-[13.5px]">
              {WEEK.map((d) => (
                <div key={d} className={cn("contents", today === d ? "font-semibold text-ink" : "text-ink-2")}>
                  <dt>{dayNames[d]}</dt>
                  <dd className="tabular text-right">{formatRanges(r.hours[d])}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
      <a
        href={mapsUrl(r.address)}
        target="_blank"
        rel="noopener"
        className="flex items-center gap-3 border-t border-line px-5 py-4 text-[14.5px] transition-colors hover:bg-surface-2/50"
      >
        <MapPin className="size-[18px] shrink-0 text-ink-3" strokeWidth={2} />
        <span className="min-w-0 flex-1 text-ink">{r.address}</span>
        <span className="text-[13px] font-medium text-accent">Directions</span>
      </a>
      <a
        href={`tel:${r.phone}`}
        className="flex items-center gap-3 border-t border-line px-5 py-4 text-[14.5px] transition-colors hover:bg-surface-2/50"
      >
        <Phone className="size-[18px] shrink-0 text-ink-3" strokeWidth={2} />
        <span className="tabular min-w-0 flex-1 text-ink">{formatPhone(r.phone)}</span>
        <span className="text-[13px] font-medium text-accent">Call</span>
      </a>
    </section>
  );
}
