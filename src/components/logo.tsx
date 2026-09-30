"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect width="24" height="24" rx="6" fill="var(--brand)" />
      <path
        d="M12 18.5v-6.2m0 0c0-2.6 1.9-4.6 4.6-4.8.1 2.7-1.9 4.8-4.6 4.8Zm0 0c0-2.1-1.6-3.8-3.8-3.9-.1 2.2 1.6 3.9 3.8 3.9Z"
        fill="none"
        stroke="var(--on-brand)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The wordmark stays Latin in both languages; it's the brand name. */
export function Logo({ className }: { className?: string }) {
  const { href } = useI18n();
  return (
    <Link
      href={href("/")}
      transitionTypes={["nav-back"]}
      className={cn("pressable inline-flex items-center gap-2 text-base font-semibold text-ink", className)}
    >
      <LogoMark />
      <span lang="en">nomm</span>
    </Link>
  );
}
