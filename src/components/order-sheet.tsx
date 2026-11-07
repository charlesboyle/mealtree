"use client";

import { ChevronRight, X } from "lucide-react";
import { deliveryAppIcon } from "@/lib/delivery-apps";
import { linkIcon } from "@/components/icons";
import { Sheet } from "@/components/sheet";
import { useI18n } from "@/i18n/client";
import { track } from "@/lib/track";
import type { Restaurant } from "@/lib/types";

/** Every delivery app (Talabat, Keeta, Deliveroo...) a restaurant can be ordered from, one row each. */
export function OrderSheet({
  restaurant: r,
  open,
  onClose,
  style,
}: {
  restaurant: Restaurant;
  open: boolean;
  onClose: () => void;
  style: React.CSSProperties;
}) {
  const i18n = useI18n();
  const { t, pick } = i18n;
  const Icon = linkIcon.order;
  const links = r.links.filter((l) => l.kind === "order");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t.menu.orderOn}
      look="modal"
      dragToClose
      style={style}
      className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
    >
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{t.menu.orderOn}</h2>
          <p className="truncate text-sm text-muted">{pick(r.name, r.nameAr)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft text-ink transition-colors duration-150 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="px-2">
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener"
              onClick={() => track(r.slug, i18n.locale, { kind: "link_click", link: "order" })}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors duration-150 hover:bg-soft active:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {deliveryAppIcon(l.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={deliveryAppIcon(l.url)!} alt="" className="size-10 shrink-0 rounded-xl" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tomato text-white" aria-hidden>
                  <Icon className="h-5 w-5" />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
                {pick(l.label, l.labelAr)}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted rtl:rotate-180" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
