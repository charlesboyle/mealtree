"use client";

import { BadgeCheck, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { linkIcon } from "@/components/icons";
import { OpenStatus } from "@/components/open-status";
import { Photo } from "@/components/photo";
import { formatVerified, mapsUrl, priceLevelLabel, sourceLabel } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

export function RestaurantHeader({
  restaurant: r,
  claimed,
  titleRef,
}: {
  restaurant: Restaurant;
  claimed: boolean;
  titleRef: React.Ref<HTMLHeadingElement>;
}) {
  const [primary, ...secondary] = r.links;
  return (
    <header>
      <div className="relative sm:mx-auto sm:max-w-2xl sm:px-5 sm:pt-3">
        <Photo
          id={r.cover}
          alt={`${r.name} food`}
          width={720}
          priority
          iconSize={40}
          className="h-[min(38vh,320px)] min-h-[220px] w-full sm:rounded-[28px]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg to-transparent sm:inset-x-5 sm:rounded-b-[28px]" />
      </div>

      <div className="relative mx-auto -mt-14 max-w-2xl px-5">
        <div
          className="grid size-[68px] animate-rise place-items-center rounded-[22px] bg-accent font-display text-[34px] text-on-accent shadow-md ring-4 ring-bg [font-variation-settings:'opsz'_72]"
          aria-hidden
        >
          {r.name.charAt(0)}
        </div>

        <h1
          ref={titleRef}
          className="mt-4 animate-rise font-display text-[40px] leading-[1.02] tracking-[-0.02em] text-ink [animation-delay:40ms] [font-variation-settings:'opsz'_72] sm:text-[48px]"
        >
          {r.name}
          {claimed && (
            <BadgeCheck
              aria-label="Verified by owner"
              className="mb-1.5 ml-2 inline size-6 fill-accent text-bg"
              strokeWidth={2}
            />
          )}
        </h1>
        <p className="mt-2 animate-rise text-[15.5px] leading-relaxed text-ink-2 [animation-delay:80ms]">
          {r.tagline}
        </p>
        <div className="mt-3 flex animate-rise flex-wrap items-center gap-x-3 gap-y-1.5 text-[13.5px] text-ink-2 [animation-delay:120ms]">
          <span>
            {r.cuisine.join(" · ")}
            <span className="mx-1.5 text-ink-3">·</span>
            <span className="text-ink">{priceLevelLabel(r.priceLevel)}</span>
          </span>
          <OpenStatus hours={r.hours} timezone={r.timezone} />
        </div>

        <nav
          aria-label="Restaurant links"
          className="no-scrollbar -mx-5 mt-5 flex animate-rise gap-2 overflow-x-auto px-5 pb-1 [animation-delay:160ms]"
        >
          {primary && <LinkButton link={primary} primary />}
          <a href={`tel:${r.phone}`} className={chip}>
            <Phone className="size-4" strokeWidth={2} /> Call
          </a>
          <a href={mapsUrl(r.address)} target="_blank" rel="noopener" className={chip}>
            <MapPin className="size-4" strokeWidth={2} /> Directions
          </a>
          {secondary.map((l) => (
            <LinkButton key={l.url + l.kind} link={l} />
          ))}
        </nav>

        <TrustNote restaurant={r} claimed={claimed} />
      </div>
    </header>
  );
}

const chipBase = "pressable flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium shadow-sm";
const chip = `${chipBase} bg-surface text-ink ring-1 ring-line hover:ring-line-strong`;
const chipPrimary = `${chipBase} bg-accent text-on-accent hover:opacity-90`;

function LinkButton({ link, primary }: { link: Restaurant["links"][number]; primary?: boolean }) {
  const Icon = linkIcon[link.kind];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener"
      className={primary ? chipPrimary : chip}
    >
      <Icon className="size-4" strokeWidth={2} /> {link.label}
    </a>
  );
}

function TrustNote({ restaurant: r, claimed }: { restaurant: Restaurant; claimed: boolean }) {
  if (claimed) {
    return (
      <p className="mt-5 flex animate-rise items-center gap-2 text-[12.5px] text-ink-3 [animation-delay:200ms]">
        <BadgeCheck className="size-4 text-accent" strokeWidth={2} />
        Menu managed by {r.name} · Updated {formatVerified(r.verifiedAt)}
      </p>
    );
  }
  return (
    <div className="mt-5 flex animate-rise items-center gap-3 rounded-2xl bg-surface p-3 pl-4 ring-1 ring-line [animation-delay:200ms]">
      <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-2">
        <span className="font-medium text-ink">Unofficial menu</span> · verified {formatVerified(r.verifiedAt)}{" "}
        from {sourceLabel[r.source].toLowerCase()}. Prices may have changed.
      </div>
      <Link
        href={`/claim/${r.slug}`}
        className="pressable shrink-0 rounded-full bg-ink px-3.5 py-2 text-[12.5px] font-semibold text-bg hover:opacity-90"
      >
        Own this?
      </Link>
    </div>
  );
}
