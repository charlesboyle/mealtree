"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { ALL_AREAS } from "@/lib/discover";

/** Area picker: a native select under a styled label, so it is a proper picker on phones. */
export function AreaSelect({
  value,
  onChange,
  areas,
  className = "",
}: {
  value: string;
  onChange: (area: string) => void;
  areas: { name: string; nameAr?: string }[];
  className?: string;
}) {
  const { t, pick } = useI18n();
  const current = areas.find((a) => a.name === value);
  return (
    <label className={`relative flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold text-plum ${className}`}>
      <MapPin className="h-4 w-4 shrink-0 text-tomato" aria-hidden />
      <span className="max-w-[9rem] truncate">{current ? pick(current.name, current.nameAr) : t.discover.allAreas}</span>
      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t.discover.areaLabel}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        <option value={ALL_AREAS}>{t.discover.allAreas}</option>
        {areas.map((a) => (
          <option key={a.name} value={a.name}>
            {pick(a.name, a.nameAr)}
          </option>
        ))}
      </select>
    </label>
  );
}
