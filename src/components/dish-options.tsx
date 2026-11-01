"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { PriceTag } from "@/components/price-tag";
import { useI18n } from "@/i18n/client";
import type { OptionGroup, Selections } from "@/lib/bag";
import { cn } from "@/lib/format";

/** Option groups: radio rows for pick-one, check rows for pick-several. */
export function DishOptions({
  groups,
  value,
  onChange,
  flagged,
  currency,
}: {
  groups: OptionGroup[];
  value: Selections;
  onChange: (next: Selections) => void;
  /** Group to flag after a failed add attempt. */
  flagged?: string;
  currency: string;
}) {
  const { t, pick } = useI18n();

  const toggle = (g: OptionGroup, id: string) => {
    const current = value[g.id] ?? [];
    let next: string[];
    if (g.max === 1) next = g.required ? [id] : current[0] === id ? [] : [id];
    else if (current.includes(id)) next = current.filter((x) => x !== id);
    else if (current.length >= g.max) return;
    else next = [...current, id];
    onChange({ ...value, [g.id]: next });
  };

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const selected = value[g.id] ?? [];
        const single = g.max === 1;
        const bad = flagged === g.id;
        const title = g.id === "variant" ? t.item.options : t.item.addOns;
        return (
          <fieldset key={g.id}>
            <legend className="flex w-full items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold text-ink">{title}</span>
              <motion.span
                animate={bad ? { x: [0, -4, 4, -2, 0] } : { x: 0 }}
                transition={{ duration: 0.28 }}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  g.required ? (bad ? "bg-tomato text-white" : "bg-soft text-ink") : "text-muted",
                )}
              >
                {g.required ? t.dish.required : t.dish.optional}
              </motion.span>
            </legend>
            <div role={single ? "radiogroup" : "group"} aria-label={title} className="mt-2 space-y-1">
              {g.choices.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role={single ? "radio" : "checkbox"}
                    aria-checked={on}
                    onClick={() => toggle(g, c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors duration-150 disabled:opacity-40",
                      on ? "bg-white shadow-card ring-1 ring-plum/15" : "hover:bg-soft",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center transition-colors duration-150",
                        single ? "rounded-full" : "rounded-md",
                        on ? "bg-plum text-white" : "bg-white ring-1 ring-inset ring-line",
                      )}
                    >
                      {on && (single ? <span className="h-2 w-2 rounded-full bg-white" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />)}
                    </span>
                    <span className="flex-1 text-sm text-ink">{pick(c.label, c.labelAr)}</span>
                    <span className="text-sm tabular-nums text-muted">
                      {g.id === "addOns" && "+"}
                      <PriceTag amount={c.price} currency={currency} className="" />
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
