import { CuisineGlyph } from "@/components/icons";
import { Photo } from "@/components/photo";
import type { Restaurant } from "@/lib/types";

/** The restaurant's cover filling its parent; a cuisine glyph stands in when there is none. */
export function RestaurantImage({ restaurant: r, width = 400, className = "" }: { restaurant: Restaurant; width?: number; className?: string }) {
  return (
    <Photo
      id={r.cover}
      alt=""
      width={width}
      className={`absolute inset-0 h-full w-full ${className}`}
      fallback={<CuisineGlyph cuisine={r.cuisine} className="size-6 opacity-70" strokeWidth={1.6} />}
    />
  );
}
