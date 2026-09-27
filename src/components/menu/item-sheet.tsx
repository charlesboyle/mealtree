"use client";

import { AnimatePresence, motion } from "motion/react";
import { Flag, Share } from "lucide-react";
import { useState } from "react";
import { Photo } from "@/components/photo";
import { useToast } from "@/components/providers";
import { Sheet } from "@/components/sheet";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { DietTags } from "./item-row";
import { PriceTag } from "./price-tag";

export function ItemSheet({
  item,
  onClose,
  claimed,
  accentStyle,
  currency,
}: {
  item: MenuItem | null;
  onClose: () => void;
  claimed: boolean;
  accentStyle: React.CSSProperties;
  currency: string;
}) {
  const { t, pick } = useI18n();
  // Keep rendering the last dish while the sheet animates out.
  const [last, setLast] = useState(item);
  if (item && item !== last) setLast(item);
  const shown = item ?? last;
  const name = shown ? pick(shown.name, shown.nameAr) : "";

  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      label={name}
      closeLabel={t.common.close}
      style={accentStyle}
      closeTone={shown?.image ? "image" : "surface"}
      header={
        shown?.image ? (
          <Photo key={shown.id} id={shown.image} alt={name} width={560} priority className="aspect-[4/3] w-full" />
        ) : (
          <div className="h-12" />
        )
      }
    >
      {shown && <ItemDetail key={shown.id} item={shown} claimed={claimed} currency={currency} />}
    </Sheet>
  );
}

function ItemDetail({ item, claimed, currency }: { item: MenuItem; claimed: boolean; currency: string }) {
  const i18n = useI18n();
  const { t, pick, alt } = i18n;
  const toast = useToast();
  const [reporting, setReporting] = useState(false);
  const [variant, setVariant] = useState(0);
  const name = pick(item.name, item.nameAr);
  const otherName = alt(item.name, item.nameAr);
  const multi = !!item.variants && item.variants.length > 1;

  const share = async () => {
    const url = `${location.origin}${location.pathname}#dish-${item.id}`;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t.common.linkCopied);
      }
    } catch {}
  };

  return (
    <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{name}</h2>
          {otherName && (
            <p lang={i18n.locale === "ar" ? "en" : "ar"} className="mt-0.5 text-sm text-ink-3">
              {otherName}
            </p>
          )}
        </div>
        <motion.span
          key={variant}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
          className="mt-1 shrink-0 text-xl font-semibold"
        >
          {item.soldOut ? (
            <span className="text-base font-medium text-ink-3">{t.item.soldOut}</span>
          ) : multi ? (
            <PriceTag amount={item.variants![variant].price} currency={currency} />
          ) : (
            <PriceTag item={item} currency={currency} />
          )}
        </motion.span>
      </div>

      {(item.popular || item.tags?.length) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {item.popular && <span className="text-sm font-medium text-accent">{t.menu.popular}</span>}
          <DietTags tags={item.tags} long className="text-sm" />
        </div>
      )}

      {item.description && (
        <p className="mt-4 text-base text-ink-2">{pick(item.description, item.descriptionAr)}</p>
      )}

      {multi && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-ink">{t.item.options}</h3>
          <div role="radiogroup" aria-label={t.item.options} className="mt-2 divide-y divide-line border-y border-line">
            {item.variants!.map((v, i) => (
              <button
                key={v.label + i}
                role="radio"
                aria-checked={variant === i}
                onClick={() => setVariant(i)}
                className="flex w-full items-center gap-3 py-3 text-start text-base"
              >
                <span
                  className={cn(
                    "grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                    variant === i ? "border-accent" : "border-line-strong",
                  )}
                >
                  <motion.span
                    initial={false}
                    animate={{ scale: variant === i ? 1 : 0 }}
                    className="size-2 rounded-full bg-accent"
                  />
                </span>
                <span className={cn("flex-1", variant === i ? "text-ink" : "text-ink-2")}>{pick(v.label, v.labelAr)}</span>
                <PriceTag amount={v.price} currency={currency} className="font-medium text-ink" />
              </button>
            ))}
          </div>
        </section>
      )}

      {item.addOns && item.addOns.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-ink">{t.item.addOns}</h3>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {item.addOns.map((a, i) => (
              <li key={a.label + i} className="flex items-center justify-between gap-3 py-3 text-base text-ink-2">
                {pick(a.label, a.labelAr)}
                <span className="font-medium text-ink">
                  +<PriceTag amount={a.price} currency={currency} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {item.tags?.length ? (
        <p className="mt-6 text-xs text-ink-3">
          {claimed ? t.item.dietOwner : t.item.dietPrinted} {t.item.allergies}
        </p>
      ) : null}

      <div className="mt-6 flex gap-2">
        <button
          onClick={share}
          className="pressable flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-medium text-bg hover:opacity-90"
        >
          <Share className="size-4" strokeWidth={2} /> {t.item.share}
        </button>
        <button
          onClick={() => setReporting((r) => !r)}
          aria-expanded={reporting}
          className={cn(
            "pressable flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium",
            reporting ? "border-ink-3 bg-surface-2 text-ink" : "border-line-strong text-ink-2 hover:text-ink",
          )}
        >
          <Flag className="size-4" strokeWidth={2} /> {t.item.wrongInfo}
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
                toast(t.item.reported);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState<number | null>(null);
  return (
    <div className="pt-4">
      <div className="flex flex-wrap gap-2">
        {t.item.reasons.map((r, i) => (
          <button
            key={r}
            onClick={() => setReason(i)}
            aria-pressed={reason === i}
            className={cn(
              "pressable h-8 rounded-full border px-3 text-sm font-medium",
              reason === i ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:text-ink",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        disabled={reason === null}
        onClick={onDone}
        className="pressable mt-3 h-10 w-full rounded-xl bg-surface-2 text-sm font-medium text-ink disabled:opacity-40"
      >
        {t.item.sendReport}
      </button>
    </div>
  );
}
