"use client";

import { useState } from "react";
import { CuisineGlyph } from "@/components/icons";
import { cn, photoSrcSet, photoUrl } from "@/lib/format";
import type { Restaurant } from "@/lib/types";

/**
 * Remote food photo that fades in once decoded. Missing or broken images leave
 * a flat tint of the restaurant's color, so a text-only menu still looks even.
 */
export function Photo({
  id,
  alt,
  width,
  className,
  priority,
  fallback,
}: {
  id?: string;
  alt: string;
  width: number;
  className?: string;
  priority?: boolean;
  /** Shown centered on the tint when there's no photo (e.g. a cuisine glyph). */
  fallback?: React.ReactNode;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const failed = !id || state === "error";

  return (
    <div className={cn("relative overflow-hidden bg-accent-soft", className)}>
      {failed && fallback && <div className="absolute inset-0 grid place-items-center text-accent">{fallback}</div>}
      {!failed && (
        <>
          {state === "loading" && <div className="skeleton absolute inset-0" />}
          {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN already sizes images */}
          <img
            src={photoUrl(id, width)}
            srcSet={photoSrcSet(id, width)}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            ref={(el) => {
              // Images can finish (or fail) before hydration attaches handlers.
              if (el?.complete && state === "loading") setState(el.naturalWidth > 0 ? "loaded" : "error");
            }}
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-500",
              state === "loaded" ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      )}
    </div>
  );
}

/** Small cover thumbnail, or the cuisine glyph when there's no photo. */
export function RestaurantThumb({ restaurant: r, className }: { restaurant: Restaurant; className?: string }) {
  return (
    <Photo
      id={r.cover}
      alt=""
      width={96}
      className={className}
      fallback={<CuisineGlyph cuisine={r.cuisine} className="size-5 opacity-70" strokeWidth={1.7} />}
    />
  );
}
