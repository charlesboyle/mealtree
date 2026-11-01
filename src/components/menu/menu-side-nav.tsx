"use client";

import { Clock, MapPin, Phone } from "lucide-react";
import { motion } from "motion/react";
import type { MenuTab } from "./menu-nav";
import { OpenStatus } from "@/components/open-status";
import { useI18n } from "@/i18n/client";
import { formatPhone } from "@/i18n/format";
import { cn } from "@/lib/format";
import { hasHours } from "@/lib/hours";
import type { Restaurant } from "@/lib/types";

/** Desktop sidebar: the essentials, then the menu's sections with counts. */
export function MenuSideNav({
  restaurant: r,
  tabs,
  activeId,
  onSelect,
  onOpenContact,
}: {
  restaurant: Restaurant;
  tabs: MenuTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onOpenContact: () => void;
}) {
  const { t, pick } = useI18n();
  const phones = [{ key: r.phone, label: "", number: r.phone }, ...r.links.filter((l) => l.kind === "phone").map((l) => ({ key: l.url, label: pick(l.label, l.labelAr), number: l.url.replace(/^tel:/, "") }))];
  return (
    <div>
      <dl className="space-y-2 rounded-2xl bg-paper p-4 text-[13px]">
        {phones.map((p) => (
          <div key={p.key} className="flex gap-2.5">
            <dt>
              <Phone className="mt-0.5 size-3.5 text-muted" aria-label={t.info.call} />
            </dt>
            <dd className="min-w-0">
              <a href={`tel:${p.number}`} className="ltr-isolate font-medium text-ink underline-offset-2 hover:underline">
                {formatPhone(p.number)}
              </a>
              {p.label && <span className="block text-[11px] text-muted">{p.label}</span>}
            </dd>
          </div>
        ))}
        {hasHours(r.hours) && (
          <div className="flex gap-2.5">
            <dt>
              <Clock className="mt-0.5 size-3.5 text-muted" aria-label={t.info.hours} />
            </dt>
            <dd>
              <OpenStatus hours={r.hours} timezone={r.timezone} className="whitespace-normal text-sm" />
            </dd>
          </div>
        )}
        <div className="flex gap-2.5">
          <dt>
            <MapPin className="mt-0.5 size-3.5 text-muted" aria-label={t.info.directions} />
          </dt>
          <dd className="text-ink">{pick(r.address, r.addressAr)}</dd>
        </div>
        <button
          type="button"
          onClick={onOpenContact}
          className="text-[13px] font-semibold text-ink underline underline-offset-2 hover:text-accent"
        >
          {t.restaurant.allContact}
        </button>
      </dl>

      {tabs.length > 0 && (
        <nav aria-label={t.menu.sections} className="pt-5">
          <p className="text-sm font-semibold text-ink">{t.restaurant.menu}</p>
          <ul className="mt-2">
            {tabs.map((tab) => {
              const on = tab.id === activeId;
              return (
                <li key={tab.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(tab.id)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "relative flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
                      on ? "font-semibold text-ink" : "text-muted hover:bg-soft hover:text-ink",
                    )}
                  >
                    {on && (
                      <motion.span
                        layoutId="side-nav-active"
                        className="absolute inset-0 rounded-lg bg-soft"
                        transition={{ type: "spring", stiffness: 520, damping: 42 }}
                      />
                    )}
                    {on && <span className="absolute inset-y-1.5 start-0 w-[3px] rounded-full bg-ink" aria-hidden />}
                    <span className="relative truncate">{tab.label}</span>
                    {tab.count !== undefined && <span className="relative ms-2 text-xs font-normal tabular-nums text-muted">{tab.count}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
