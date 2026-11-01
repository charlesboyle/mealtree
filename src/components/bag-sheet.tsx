"use client";

import { AnimatePresence, motion } from "motion/react";
import { Info, MessageCircleMore, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Photo } from "@/components/photo";
import { PriceTag } from "@/components/price-tag";
import { QtyButton } from "@/components/qty-button";
import { Sheet } from "@/components/sheet";
import { Swap } from "@/components/swap";
import { useI18n } from "@/i18n/client";
import type { ResolvedLine } from "@/lib/bag";

/** The order so far: adjust quantities, then continue on WhatsApp with the drafted message. */
export function BagSheet({
  open,
  onClose,
  restaurantName,
  currency,
  style,
  lines,
  count,
  total,
  whatsappHref,
  phone,
  onQty,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  restaurantName: string;
  currency: string;
  style: React.CSSProperties;
  lines: ResolvedLine[];
  count: number;
  total: number;
  whatsappHref: string;
  phone: string;
  onQty: (key: string, qty: number) => void;
  onSend: () => void;
}) {
  const { t, pick } = useI18n();
  const [note, setNote] = useState(false);

  // Nothing left to show: close rather than leave an empty sheet.
  useEffect(() => {
    if (open && count === 0) onClose();
  }, [open, count, onClose]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t.bag.title}
      look="modal"
      dragToClose
      style={style}
      className="mx-3 mb-[max(12px,env(safe-area-inset-bottom))] flex max-h-[80dvh] w-[calc(100%-1.5rem)] max-w-md flex-col rounded-3xl bg-surface shadow-2xl sm:mx-0 sm:mb-0 sm:w-full"
    >
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <h2 className="text-lg font-bold text-plum">{t.bag.title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-plum transition-colors duration-150 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
        <AnimatePresence initial={false}>
          {lines.map(({ key, item, qty, unit, choices }) => {
            const name = pick(item.name, item.nameAr);
            return (
              <motion.li
                key={key}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-3 py-2.5"
              >
                {item.image ? <Photo id={item.image} alt="" width={96} className="h-12 w-12 shrink-0 rounded-xl" /> : <span className="h-12 w-12 shrink-0 rounded-xl bg-paper" aria-hidden />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-plum">{name}</p>
                  {choices.length > 0 && <p className="truncate text-xs text-muted">{choices.map((c) => pick(c.label, c.labelAr)).join(" · ")}</p>}
                  <PriceTag amount={unit * qty} currency={currency} className="text-sm tabular-nums text-muted" />
                </div>
                <QtyButton qty={qty} name={name} onAdd={() => onQty(key, qty + 1)} onRemove={() => onQty(key, qty - 1)} />
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="shrink-0 px-5 pb-5 pt-3">
        <button
          type="button"
          onClick={() => setNote((n) => !n)}
          aria-expanded={note}
          className="flex w-full items-center justify-between gap-3 text-start"
        >
          <span className="flex items-center gap-1.5 text-sm text-muted">
            {t.bag.estimated}
            <Info className="h-3.5 w-3.5" aria-hidden />
          </span>
          <Swap id={total} className="text-lg font-bold tabular-nums text-plum">
            <PriceTag amount={total} currency={currency} />
          </Swap>
        </button>
        <AnimatePresence initial={false}>
          {note && (
            <motion.p
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden text-xs leading-relaxed text-muted"
            >
              <span className="block pt-1">{t.bag.confirmNote}</span>
            </motion.p>
          )}
        </AnimatePresence>
        <div className="mt-3 flex items-center gap-2">
          <motion.a
            href={whatsappHref}
            target="_blank"
            rel="noopener"
            onClick={onSend}
            whileTap={{ scale: 0.98 }}
            className="flex h-[52px] min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-whatsapp px-3 text-sm font-semibold text-white transition-colors hover:bg-whatsapp-dark"
          >
            <MessageCircleMore className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} aria-hidden />
            <span className="truncate">{t.bag.continue}</span>
          </motion.a>
          <motion.a
            href={`tel:${phone}`}
            whileTap={{ scale: 0.94 }}
            aria-label={t.bag.callRestaurant(restaurantName)}
            title={t.bag.callRestaurant(restaurantName)}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-soft text-plum transition-colors hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tomato"
          >
            <Phone className="h-5 w-5" aria-hidden />
          </motion.a>
        </div>
      </div>
    </Sheet>
  );
}
