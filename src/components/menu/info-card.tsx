"use client";

import { useMinute } from "@/components/open-status";
import { useI18n } from "@/i18n/client";
import { formatPhone } from "@/i18n/format";
import { cn, mapsUrl } from "@/lib/format";
import { nowIn } from "@/lib/hours";
import type { Hours, Restaurant } from "@/lib/types";

// The UAE week runs Monday to Sunday (weekend Saturday–Sunday).
const WEEK: (keyof Hours)[] = [1, 2, 3, 4, 5, 6, 0];

export function InfoSection({ restaurant: r }: { restaurant: Restaurant }) {
  const i18n = useI18n();
  const { t, pick } = i18n;
  const minute = useMinute();
  const today = minute ? nowIn(r.timezone, new Date(minute * 60000)).day : null;

  return (
    <section aria-labelledby="info-title" className="mt-14 border-t border-line pt-8">
      <h2 id="info-title" className="text-xl font-semibold tracking-tight">
        {t.info.title}
      </h2>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
        {WEEK.map((d) => (
          <div key={d} className={cn("contents", today === d ? "font-medium text-ink" : "text-ink-2")}>
            <dt>{t.hours.days[d]}</dt>
            <dd className="tabular text-end">{i18n.ranges(r.hours[d])}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 divide-y divide-line border-y border-line">
        <Row
          href={mapsUrl(r.address)}
          external
          action={t.info.directions}
          primary={pick(r.address, r.addressAr)}
        />
        <Row href={`tel:${r.phone}`} action={t.info.call} primary={<span className="ltr-isolate">{formatPhone(r.phone)}</span>} />
        {r.links.map((l) => (
          <Row key={l.kind + l.url} href={l.url} external action={t.links[l.kind]} primary={pick(l.label, l.labelAr)} />
        ))}
      </div>
    </section>
  );
}

function Row({
  href,
  external,
  action,
  primary,
}: {
  href: string;
  external?: boolean;
  action: string;
  primary: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className="flex items-center gap-4 py-3.5 text-base transition-colors hover:bg-surface-2/50"
    >
      <span className="min-w-0 flex-1 text-ink">{primary}</span>
      <span className="shrink-0 text-sm font-medium text-accent">{action}</span>
    </a>
  );
}
