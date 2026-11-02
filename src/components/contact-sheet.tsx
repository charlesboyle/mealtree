"use client";

import { ChevronRight, MapPin, Phone, X } from "lucide-react";
import { linkIcon } from "@/components/icons";
import { useMinute } from "@/components/open-status";
import { Sheet } from "@/components/sheet";
import { useI18n } from "@/i18n/client";
import { formatPhone } from "@/i18n/format";
import { cn, directionsUrl } from "@/lib/format";
import { hasHours, nowIn } from "@/lib/hours";
import { track, type TrackLink } from "@/lib/track";
import type { Hours, Restaurant } from "@/lib/types";

// The UAE week runs Monday to Sunday.
const WEEK: (keyof Hours)[] = [1, 2, 3, 4, 5, 6, 0];

/** Hours, address, phone numbers and every link the restaurant has, in one sheet. */
export function ContactSheet({
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
  const minute = useMinute();
  const today = minute ? nowIn(r.timezone, new Date(minute * 60000)).day : null;
  const click = (link: TrackLink) => () => track(r.slug, i18n.locale, { kind: "link_click", link });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t.restaurant.contactTitle}
      look="modal"
      dragToClose
      style={style}
      className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
    >
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{t.restaurant.contactTitle}</h2>
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
        <Row href={directionsUrl(r)} onClick={click("maps")} external icon={<MapPin className="h-5 w-5" />} title={pick(r.address, r.addressAr)} detail={t.info.directions} />
        {r.phone && (
          <Row
            href={`tel:${r.phone}`}
            onClick={click("call")}
            icon={<Phone className="h-5 w-5" />}
            title={<span className="ltr-isolate">{formatPhone(r.phone)}</span>}
            detail={t.info.call}
          />
        )}
        {r.links
          .filter((l) => l.kind !== "maps")
          .map((l) => {
            const Icon = linkIcon[l.kind];
            const whatsapp = l.kind === "whatsapp";
            return l.kind === "phone" ? (
              <Row
                key={l.url}
                href={l.url}
                onClick={click("call")}
                icon={<Phone className="h-5 w-5" />}
                title={<span className="ltr-isolate">{formatPhone(l.url.replace(/^tel:/, ""))}</span>}
                detail={pick(l.label, l.labelAr)}
              />
            ) : (
              <Row
                key={l.kind + l.url}
                href={l.url}
                onClick={click(l.kind)}
                external
                tone={whatsapp ? "bg-whatsapp text-white" : undefined}
                icon={<Icon className="h-5 w-5" />}
                title={pick(l.label, l.labelAr)}
                detail={t.links[l.kind]}
              />
            );
          })}
      </ul>

      {hasHours(r.hours) && (
        <dl className="mx-5 mt-1 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 rounded-2xl bg-paper px-3 py-3 text-sm">
          {WEEK.map((d) => (
            <div key={d} className={cn("contents", today === d ? "font-medium text-ink" : "text-muted")}>
              <dt>{t.hours.days[d]}</dt>
              <dd className="text-end tabular-nums">{i18n.ranges(r.hours[d])}</dd>
            </div>
          ))}
        </dl>
      )}
    </Sheet>
  );
}

function Row({
  href,
  icon,
  title,
  detail,
  tone = "bg-soft text-ink",
  external,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  detail: string;
  tone?: string;
  external?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <a
        href={href}
        onClick={onClick}
        {...(external ? { target: "_blank", rel: "noopener" } : {})}
        className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors duration-150 hover:bg-soft active:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium text-ink">{title}</span>
          <span className="block truncate text-[13px] text-muted">{detail}</span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted rtl:rotate-180" aria-hidden />
      </a>
    </li>
  );
}
