"use client";

import { usePathname } from "next/navigation";

/** The current path without its language prefix: "/en/r/abc" → "/r/abc", "/ar" → "/". */
export function useRoute() {
  const pathname = usePathname();
  return pathname.replace(/^\/(en|ar)(?=\/|$)/, "") || "/";
}
