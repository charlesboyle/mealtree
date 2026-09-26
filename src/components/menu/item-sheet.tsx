"use client";

import { AnimatePresence, motion } from "motion/react";
import { Flag, Link2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Photo } from "@/components/photo";
import { useToast } from "@/components/providers";
import { Sheet } from "@/components/sheet";
import { cn, formatPrice, itemPriceLabel } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { DietPill } from "./item-row";

export function ItemSheet({
  item,
  onClose,
  claimed,
  accentStyle,
}: {
  item: MenuItem | null;
  onClose: () => void;
  claimed: boolean;
  accentStyle: React.CSSProperties;
}) {
  // Keep rendering the last dish while the sheet animates out.
  const [last, setLast] = useState(item);
  if (item && item !== last) setLast(item);
  const shown = item ?? last;

  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      label={shown?.name ?? "Dish"}
      style={accentStyle}
      closeTone={shown?.image ? "image" : "surface"}
      header={
        shown?.image ? (
          <Photo
            key={shown.id}
            id={shown.image}
            alt={shown.name}
            width={560}
            priority
            className="aspect-[4/3] w-full"
            iconSize={32}
          />
        ) : (
          <div className="h-12" />
        )
      }
    >
      {shown && <ItemDetail key={shown.id} item={shown} claimed={claimed} />}
    </Sheet>
  );
}

function ItemDetail({ item, claimed }: { item: MenuItem; claimed: boolean }) {
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const [variant, setVariant] = useState(0);

  const share = async () => {
    const url = `${location.origin}${location.pathname}#dish-${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: item.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {}
  };

  const shownPrice =
    item.variants && item.variants.length > 1 ? formatPrice(item.variants[variant].price) : itemPriceLabel(item);

  return (
    <div className="px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-[30px] leading-[1.05] tracking-[-0.015em] text-ink [font-variation-settings:'opsz'_48]">
          {item.name}
        </h2>
        <motion.span
          key={shownPrice}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="tabular mt-1 shrink-0 text-xl font-semibold tracking-tight"
        >
          {item.soldOut ? <span className="text-ink-3">Sold out</span> : shownPrice}
        </motion.span>
      </div>

      {(item.popular || item.tags?.length) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.popular && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1.5 text-[11px] font-medium leading-none text-accent">
              <Sparkles className="size-3" strokeWidth={2.2} aria-hidden /> Popular
            </span>
          )}
          {item.tags?.map((t) => <DietPill key={t} tag={t} withLabel />)}
        </div>
      )}

      {item.description && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{item.description}</p>}

      {item.variants && item.variants.length > 1 && (
        <section className="mt-6">
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">Options</h3>
          <div role="radiogroup" className="grid gap-1.5">
            {item.variants.map((v, i) => (
              <button
                key={v.label}
                role="radio"
                aria-checked={variant === i}
                onClick={() => setVariant(i)}
                className={cn(
                  "pressable relative flex items-center justify-between rounded-2xl px-4 py-3 text-left text-[14.5px]",
                  variant === i ? "text-ink" : "text-ink-2 hover:bg-surface-2",
                )}
              >
                {variant === i && (
                  <motion.span
                    layoutId={`variant-${item.id}`}
                    className="absolute inset-0 rounded-2xl bg-accent-soft ring-1 ring-accent-line"
                  />
                )}
                <span className="relative flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-[18px] place-items-center rounded-full border-[1.5px] transition-colors",
                      variant === i ? "border-accent" : "border-line-strong",
                    )}
                  >
                    <motion.span
                      initial={false}
                      animate={{ scale: variant === i ? 1 : 0 }}
                      className="size-2 rounded-full bg-accent"
                    />
                  </span>
                  {v.label}
                </span>
                <span className="tabular relative font-medium">{formatPrice(v.price)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {item.addOns && (
        <section className="mt-6">
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">Add-ons</h3>
          <ul className="divide-y divide-line rounded-2xl bg-surface-2/60 px-4">
            {item.addOns.map((a) => (
              <li key={a.label} className="flex items-center justify-between py-3 text-[14.5px] text-ink-2">
                {a.label}
                <span className="tabular font-medium text-ink">+{formatPrice(a.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.tags?.length ? (
        <p className="mt-6 text-[12.5px] leading-relaxed text-ink-3">
          {claimed
            ? "Dietary details provided by the restaurant."
            : "Dietary labels are as printed on the menu."}{" "}
          Always confirm allergies with staff.
        </p>
      ) : null}

      <div className="mt-6 flex gap-2">
        <button
          onClick={share}
          className="pressable flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[14px] font-medium text-bg hover:opacity-90"
        >
          <Link2 className="size-4" strokeWidth={2.2} /> Share dish
        </button>
        <button
          onClick={() => setReporting((r) => !r)}
          aria-expanded={reporting}
          className={cn(
            "pressable flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-medium",
            reporting ? "bg-surface-3 text-ink" : "bg-surface-2 text-ink-2 hover:text-ink",
          )}
        >
          <Flag className="size-4" strokeWidth={2.2} /> Wrong info?
        </button>
      </div>

      <AnimatePresence initial={false}>
        {reporting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ReportForm
              onDone={() => {
                setReporting(false);
                toast("Thanks — we'll re-verify this");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const REASONS = ["Price changed", "No longer served", "Wrong description", "Photo is wrong"];

function ReportForm({ onDone }: { onDone: () => void }) {
  const [reason, setReason] = useState<string | null>(null);
  return (
    <div className="pt-4">
      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <button
            key={r}
            onClick={() => setReason(r)}
            className={cn(
              "pressable rounded-full px-3 py-2 text-[13px] font-medium ring-1",
              reason === r ? "bg-accent text-on-accent ring-accent" : "text-ink-2 ring-line-strong hover:text-ink",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        disabled={!reason}
        onClick={onDone}
        className="pressable mt-3 h-10 w-full rounded-full bg-surface-2 text-[13.5px] font-medium text-ink disabled:opacity-40"
      >
        Send report
      </button>
    </div>
  );
}
