"use client";

import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  MapPin,
  MessageCircleMore,
  Phone,
  Share,
  Star,
} from "lucide-react";
import { motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect } from "react";
import { CuisineGlyph, linkIcon } from "@/components/icons";
import { LanguageToggle } from "@/components/language-toggle";
import { Photo } from "@/components/photo";
import { SaveButton } from "@/components/save-button";
import { useI18n } from "@/i18n/client";
import { cn, directionsUrl } from "@/lib/format";
import { useOpenState } from "@/lib/use-open-state";
import { track, type TrackLink } from "@/lib/track";
import type { Restaurant } from "@/lib/types";

export const circle =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-ink shadow-pill transition-transform duration-150 ease-out hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink";

const MotionLink = motion.create(Link);

type Action = {
  key: string;
  link: TrackLink;
  href?: string;
  label: string;
  title?: string;
  icon: React.ElementType;
  external?: boolean;
  tone: "accent" | "whatsapp" | "plain";
  onClick?: () => void;
};

/** Cover photo with back / share / save, then the restaurant's name card and quick actions. */
export function RestaurantHero({
  restaurant: r,
  claimed,
  whatsappHref,
  onShare,
  onOpenContact,
  titleRef,
}: {
  restaurant: Restaurant;
  claimed: boolean;
  /** Chat link to the restaurant's WhatsApp, with the order drafted when the bag has dishes. Null when there is none. */
  whatsappHref: string | null;
  onShare: () => void;
  onOpenContact: () => void;
  titleRef: React.Ref<HTMLHeadingElement>;
}) {
  const { t, pick, cuisines, priceLevel, href, locale } = useI18n();
  const name = pick(r.name, r.nameAr);
  const meta = [
    cuisines(r.cuisine),
    pick(r.neighborhood, r.neighborhoodAr),
    priceLevel(r.priceLevel),
  ].filter(Boolean);

  const primary = r.links.find(
    (l) => l.kind === "reserve" || l.kind === "order",
  );
  const extraPhones = r.links.some((l) => l.kind === "phone");
  const wa: Action[] = whatsappHref
    ? [
        {
          key: "wa",
          link: "whatsapp" as const,
          href: whatsappHref,
          label: t.links.whatsapp,
          icon: MessageCircleMore,
          external: true,
          tone: "whatsapp" as const,
        },
      ]
    : [];
  const first: Action[] = primary
    ? [
        {
          key: "primary",
          link: primary.kind,
          href: primary.url,
          label: t.links[primary.kind],
          title: pick(primary.label, primary.labelAr),
          icon: linkIcon[primary.kind],
          external: true,
          tone: "accent" as const,
        },
      ]
    : [];
  const actions: Action[] = [
    ...wa,
    ...first,
    // Several numbers open the contact sheet; a lone number dials; no number, no button.
    ...(extraPhones || r.phone
      ? [
          extraPhones
            ? {
                key: "call",
                link: "call" as const,
                label: t.menu.call,
                icon: Phone,
                tone: "plain" as const,
                onClick: onOpenContact,
              }
            : {
                key: "call",
                link: "call" as const,
                href: `tel:${r.phone}`,
                label: t.menu.call,
                icon: Phone,
                tone: "plain" as const,
              },
        ]
      : []),
    {
      key: "maps",
      link: "maps" as const,
      href: directionsUrl(r),
      label: t.menu.map,
      icon: MapPin,
      external: true,
      tone: "plain" as const,
    },
  ].slice(0, 4);

  const tone = {
    accent: "bg-tomato text-white hover:bg-tomato-dark active:scale-[0.97]",
    whatsapp:
      "bg-whatsapp text-white hover:bg-whatsapp-dark active:scale-[0.97]",
    plain: "bg-plum/[0.05] text-plum hover:bg-plum/[0.09] active:scale-[0.97]",
  };
  const body = (a: Action) => (
    <>
      <a.icon
        className="h-[18px] w-[18px] shrink-0"
        strokeWidth={2.25}
        aria-hidden
      />
      <span className="truncate">{a.label}</span>
    </>
  );
  const actionClass = (a: Action) =>
    cn(
      "flex h-11 min-w-0 items-center justify-center gap-2 rounded-full px-2 text-sm md:px-5 font-semibold transition-[background-color,box-shadow,transform] duration-150",
      tone[a.tone],
    );
  const status = useOpenState(r);

  // Pulling down past the top (iOS and macOS rubber-banding) stretches the cover from its bottom edge.
  const pull = useMotionValue(0);
  const stretch = useTransform(pull, [0, 160], [1, 1.45]);
  useEffect(() => {
    const onScroll = () => pull.set(Math.max(0, -window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pull]);

  return (
    <header className="max-md:relative max-md:z-[41]">
      <div className="mx-auto max-w-6xl md:px-6 md:pt-5 lg:px-8">
        <div className="relative h-36 overflow-hidden bg-soft sm:h-44 md:h-52 md:rounded-2xl">
          <motion.div
            style={{ scale: stretch, transformOrigin: "50% 100%" }}
            className="absolute inset-0"
          >
            <Photo
              id={r.cover}
              alt=""
              width={1200}
              priority
              fallback={
                <CuisineGlyph
                  cuisine={r.cuisine}
                  className="size-10 opacity-70"
                  strokeWidth={1.5}
                />
              }
              className="absolute inset-0 h-full w-full"
            />
          </motion.div>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 md:p-4">
            <MotionLink
              whileTap={{ scale: 0.9 }}
              href={href("/")}
              aria-label={t.menu.allRestaurants}
              className={circle}
            >
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </MotionLink>
            <div className="flex items-center gap-2">
              <div className="md:hidden">
                <LanguageToggle className="h-9 min-w-9 justify-center rounded-full! bg-white/95 shadow-pill" />
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onShare}
                aria-label={t.menu.share}
                className={circle}
              >
                <Share className="h-4 w-4" aria-hidden />
              </motion.button>
              <SaveButton slug={r.slug} name={name} variant="circle" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto -mt-8 max-w-6xl px-4 sm:px-6 md:-mt-12 lg:px-8">
        <div className="rounded-2xl bg-white p-4 shadow-float ring-1 ring-line/70 md:ms-4 md:flex md:items-center md:justify-between md:gap-8 md:p-5">
          <div className="min-w-0 md:flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1
                  ref={titleRef}
                  className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-plum"
                >
                  {name}
                  {claimed && (
                    <BadgeCheck
                      aria-label={t.menu.verified}
                      className="-mt-1 ms-1.5 inline size-5 fill-accent text-surface"
                      strokeWidth={2}
                    />
                  )}
                </h1>
                <p className="mt-0.5 text-sm text-muted">
                  {meta.map((part, i) => (
                    <Fragment key={i}>
                      {i > 0 && <span className="mx-1.5">·</span>}
                      {part}
                    </Fragment>
                  ))}
                </p>
              </div>
              {r.rating !== undefined && (
                <span className="mt-1 flex shrink-0 items-center gap-1 text-sm font-semibold text-plum md:hidden">
                  <Star
                    className="h-3.5 w-3.5 fill-tomato text-tomato"
                    aria-hidden
                  />
                  {r.rating.toFixed(1)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenContact}
              className="mt-2 flex items-center gap-1.5 text-start text-sm font-medium text-plum"
            >
              {status && (
                <>
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-fresh" : "bg-muted"}`}
                    aria-hidden
                  />
                  <span className={status.open ? "text-fresh" : "text-muted"}>
                    {status.text}
                  </span>
                  <span className="text-muted">·</span>
                </>
              )}
              <span className={status ? "text-muted" : ""}>
                {t.restaurant.hoursAndInfo}
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 text-muted rtl:rotate-180"
                aria-hidden
              />
            </button>
          </div>

          <div className="md:flex md:shrink-0 md:items-center md:gap-5">
            {r.rating !== undefined && (
              <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-plum md:flex">
                <Star
                  className="h-3.5 w-3.5 fill-tomato text-tomato"
                  aria-hidden
                />
                {r.rating.toFixed(1)}
              </span>
            )}
            <nav
              aria-label={name}
              className={cn(
                "mt-4 grid gap-2 md:mt-0 md:flex md:shrink-0",
                actions.length === 3
                  ? "grid-cols-[1.4fr_1fr_1fr]"
                  : "auto-cols-fr grid-flow-col",
              )}
            >
              {actions.map((a) =>
                a.href ? (
                  <a
                    key={a.key}
                    href={a.href}
                    title={a.title}
                    aria-label={a.title ? `${a.label}: ${a.title}` : undefined}
                    onClick={() =>
                      track(r.slug, locale, {
                        kind: "link_click",
                        link: a.link,
                      })
                    }
                    {...(a.external
                      ? { target: "_blank", rel: "noopener" }
                      : {})}
                    className={actionClass(a)}
                  >
                    {body(a)}
                  </a>
                ) : (
                  <button
                    key={a.key}
                    type="button"
                    onClick={a.onClick}
                    className={actionClass(a)}
                  >
                    {body(a)}
                  </button>
                ),
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
