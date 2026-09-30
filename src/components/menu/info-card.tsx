"use client";

import { useMinute } from "@/components/open-status";
import { useI18n } from "@/i18n/client";
import { formatPhone } from "@/i18n/format";
import { cn, directionsUrl } from "@/lib/format";
import { hasHours, nowIn } from "@/lib/hours";
import { track, type TrackLink } from "@/lib/track";
import type { Hours, Restaurant } from "@/lib/types";

// The UAE week runs Monday to Sunday (weekend Saturday–Sunday).
const WEEK: (keyof Hours)[] = [1, 2, 3, 4, 5, 6, 0];

export function InfoSection({ restaurant: r }: { restaurant: Restaurant }) {
  const i18n = useI18n();
  const { t, pick } = i18n;
  const click = (link: TrackLink) => () =>
    track(r.slug, i18n.locale, { kind: "link_click", link });
  const minute = useMinute();
  const today = minute ? nowIn(r.timezone, new Date(minute * 60000)).day : null;

  return (
    <section aria-labelledby="info-title" className="mt-14 border-t border-line pt-8">
      <h2 id="info-title" className="text-xl font-semibold tracking-tight">
        {t.info.title}
      </h2>

      {hasHours(r.hours) && (
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
        {WEEK.map((d) => (
          <div key={d} className={cn("contents", today === d ? "font-medium text-ink" : "text-ink-2")}>
            <dt>{t.hours.days[d]}</dt>
            <dd className="tabular text-end">{i18n.ranges(r.hours[d])}</dd>
          </div>
        ))}
      </dl>
      )}

      <div className={cn("divide-y divide-line border-y border-line", hasHours(r.hours) ? "mt-6" : "mt-4")}>
        <Row
          href={directionsUrl(r)}
          onClick={click("maps")}
          external
          action={t.info.directions}
          primary={pick(r.address, r.addressAr)}
        />
        <Row href={`tel:${r.phone}`} onClick={click("call")} action={t.info.call} primary={<span className="ltr-isolate">{formatPhone(r.phone)}</span>} />
        {r.links.filter((l) => l.kind !== "maps").map((l) =>
          l.kind === "phone" ? (
            <Row
              key={l.url}
              href={l.url}
              onClick={click("call")}
              action={t.links.phone}
              primary={
                <>
                  {pick(l.label, l.labelAr)} <span className="ltr-isolate text-ink-2">{formatPhone(l.url.replace(/^tel:/, ""))}</span>
                </>
              }
            />
          ) : (
            <Row key={l.kind + l.url} href={l.url} onClick={click(l.kind)} external action={t.links[l.kind]} primary={pick(l.label, l.labelAr)} />
          ),
        )}
      </div>
    </section>
  );
}

function Row({
  href,
  external,
  action,
  primary,
  onClick,
}: {
  href: string;
  onClick: () => void;
  external?: boolean;
  action: string;
  primary: React.ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className="flex items-center gap-4 py-3.5 text-base transition-colors hover:bg-surface-2/50"
    >
      <span className="min-w-0 flex-1 text-ink">{primary}</span>
      <span className="shrink-0 text-sm font-medium text-accent">{action}</span>
    </a>
  );
}
