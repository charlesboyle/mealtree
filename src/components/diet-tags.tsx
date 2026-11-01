"use client";

import { Flame } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import type { DietTag } from "@/lib/types";

/** Diet tags as quiet words ("Vegan · GF"); spicy gets a small flame so it stands out. */
export function DietTags({ tags, long, className }: { tags?: DietTag[]; long?: boolean; className?: string }) {
  const { t } = useI18n();
  if (!tags?.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-3", className)}>
      {tags.map((tag) => (
        <span key={tag} title={t.diet[tag]} className={cn("inline-flex items-center gap-0.5", tag === "spicy" && "text-danger")}>
          {tag === "spicy" && <Flame className="size-3" strokeWidth={2.2} aria-hidden />}
          {long ? t.diet[tag] : t.dietShort[tag]}
        </span>
      ))}
    </span>
  );
}
