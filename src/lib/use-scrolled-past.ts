"use client";

import { type RefObject, useEffect, useState } from "react";

/** True once the referenced element has scrolled above `offset` px from the viewport top. */
export function useScrolledPast(ref: RefObject<HTMLElement | null>, offset: number): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < offset), {
      rootMargin: `-${offset}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, offset]);

  return past;
}
