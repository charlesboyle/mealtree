"use client";

import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { cn, photoSrcSet, photoUrl } from "@/lib/format";

/**
 * Remote food photo that fades in once decoded. Missing or broken images fall
 * back to a quiet accent-tinted tile so text-only menus still look deliberate.
 */
export function Photo({
  id,
  alt,
  width,
  className,
  priority,
  iconSize = 20,
}: {
  id?: string;
  alt: string;
  width: number;
  className?: string;
  priority?: boolean;
  iconSize?: number;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const failed = !id || state === "error";

  return (
    <div className={cn("relative overflow-hidden bg-accent-soft", className)}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_90%_at_30%_20%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_70%)]">
          <UtensilsCrossed
            aria-hidden
            className="text-accent opacity-35"
            style={{ width: iconSize, height: iconSize }}
            strokeWidth={1.6}
          />
        </div>
      ) : (
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
              "absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 ease-out-expo",
              state === "loaded" ? "scale-100 opacity-100" : "scale-[1.03] opacity-0",
            )}
          />
        </>
      )}
    </div>
  );
}
