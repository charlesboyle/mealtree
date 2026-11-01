"use client";

import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useSaved } from "@/lib/saved";
import { cn } from "@/lib/format";

/** Heart toggle for a restaurant. `overlay` sits on photos; `plain` sits on the page. */
export function SaveButton({
  slug,
  name,
  variant = "overlay",
  className,
}: {
  slug: string;
  name: string;
  variant?: "overlay" | "plain" | "circle";
  className?: string;
}) {
  const { t } = useI18n();
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(slug);
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      transition={{ duration: 0.12 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? t.saved.remove(name) : t.saved.add(name)}
      className={cn(
        "flex shrink-0 items-center justify-center transition-[transform,background-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
        variant === "overlay" && "h-8 w-8 rounded-full bg-white/95 shadow-pill hover:scale-105 hover:bg-white",
        variant === "circle" && "h-9 w-9 rounded-full bg-white/95 shadow-pill hover:scale-105",
        variant === "plain" && "h-9 w-9 rounded-full hover:bg-soft",
        className,
      )}
    >
      <motion.span key={String(saved)} initial={saved ? { scale: 0.6 } : false} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.35, bounce: 0.5 }} className="flex">
        <Heart className={cn("h-4 w-4 transition-colors duration-150", saved ? "fill-tomato text-tomato" : "text-ink")} aria-hidden />
      </motion.span>
    </motion.button>
  );
}
