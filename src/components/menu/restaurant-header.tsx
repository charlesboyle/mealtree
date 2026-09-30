"use client";

import { BadgeCheck, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { linkIcon } from "@/components/icons";
import { OpenStatus } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { useI18n } from "@/i18n/client";
import { cn, mapsUrl } from "@/lib/format";
import { track, type TrackLink } from "@/lib/track";
import type { ExternalLink, Restaurant } from "@/lib/types";

export function RestaurantHeader({
  restaurant: r,
  claimed,
  titleRef,
}: {
  restaurant: Restaurant;
  claimed: boolean;
  titleRef: React.Ref<HTMLHeadingElement>;
}) {
  const { t, pick, cuisines, priceLevel } = useI18n();
  const name = pick(r.name, r.nameAr);
  return (
    <header>
      {r.cover ? (
        <div className="sm:mx-auto sm:max-w-2xl sm:px-5 sm:pt-16">
          <Photo
            id={r.cover}
            alt=""
            width={720}
            priority
            className="aspect-[16/10] max-h-[300px] w-full sm:aspect-[2/1] sm:rounded-2xl"
          />
        </div>
      ) : (
        <div className="h-14" />
      )}

      <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-5">
        <h1 ref={titleRef} className="text-3xl font-bold tracking-tight text-ink">
          {name}
          {claimed && (
            <BadgeCheck
              aria-label={t.menu.verified}
              className="-mt-1 ms-1.5 inline size-6 fill-accent text-bg"
              strokeWidth={2}
            />
          )}
        </h1>
        <p className="mt-1.5 text-base text-ink-2">{pick(r.tagline, r.taglineAr)}</p>
        <p className="mt-3 text-sm text-ink-2">
          {cuisines(r.cuisine)}
          <Dot />
          {pick(r.neighborhood, r.neighborhoodAr)}
          <Dot />
          {priceLevel(r.priceLevel)}
        </p>
        <OpenStatus hours={r.hours} timezone={r.timezone} className="mt-1 block text-sm" />

        <ActionRow restaurant={r} />
        <TrustNote restaurant={r} claimed={claimed} />
      </div>
    </header>
  );
}

function Dot() {
  return <span className="mx-1.5 text-ink-3">·</span>;
}

type Action = {
  key: string;
  link: TrackLink;
  href: string;
  label: string;
  title?: string;
  icon: React.ElementType;
  external?: boolean;
};

/**
 * Equal-width buttons, icon over label (the Apple Maps pattern): the menu's
 * main action first in the restaurant's color, then call and directions.
 * Four fit a phone without truncating; Instagram etc. beyond that drop off.
 */
function ActionRow({ restaurant: r }: { restaurant: Restaurant }) {
  const { t, pick, locale } = useI18n();
  const primaryKinds: ExternalLink["kind"][] = ["reserve", "order"];
  const primary = r.links.find((l) => primaryKinds.includes(l.kind));
  // Extra phone numbers live in the info section, not the four action buttons.
  const rest = r.links.filter((l) => l !== primary && l.kind !== "phone");
  const fromLink = (l: ExternalLink): Action => ({
    key: l.kind + l.url,
    link: l.kind,
    href: l.url,
    label: t.links[l.kind],
    title: pick(l.label, l.labelAr),
    icon: linkIcon[l.kind],
    external: true,
  });
  const actions: Action[] = [
    ...(primary ? [fromLink(primary)] : []),
    { key: "call", link: "call" as const, href: `tel:${r.phone}`, label: t.menu.call, icon: Phone },
    { key: "maps", link: "maps" as const, href: mapsUrl(r.address), label: t.menu.directions, icon: MapPin, external: true },
    ...rest.map(fromLink),
  ].slice(0, 4);

  return (
    <nav aria-label={pick(r.name, r.nameAr)} className="mt-5 grid auto-cols-fr grid-flow-col gap-2">
      {actions.map((a, i) => {
        const main = i === 0 && !!primary;
        return (
          <a
            key={a.key}
            href={a.href}
            title={a.title}
            aria-label={a.title}
            onClick={() => track(r.slug, locale, { kind: "link_click", link: a.link })}
            {...(a.external ? { target: "_blank", rel: "noopener" } : {})}
            className={cn(
              "pressable flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-medium",
              main ? "bg-accent text-on-accent hover:opacity-90" : "bg-surface-2 text-ink hover:bg-surface-3",
            )}
          >
            <a.icon className="size-5" strokeWidth={1.9} aria-hidden />
            <span className="max-w-full truncate">{a.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function TrustNote({ restaurant: r, claimed }: { restaurant: Restaurant; claimed: boolean }) {
  const { t, pick, date, href } = useI18n();
  if (claimed) {
    return (
      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-3">
        <BadgeCheck className="size-3.5 shrink-0 text-accent" strokeWidth={2} />
        {t.menu.managedBy(pick(r.name, r.nameAr), date(r.verifiedAt))}
      </p>
    );
  }
  return (
    <p className="mt-4 text-xs text-ink-3">
      <span className="font-medium text-ink-2">{t.menu.unofficial}.</span>{" "}
      {t.menu.checkedFrom(date(r.verifiedAt), t.source[r.source])}{" "}
      <Link href={href(`/claim/${r.slug}`)} transitionTypes={["nav-forward"]} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink">
        {t.menu.ownThis}
      </Link>
    </p>
  );
}
