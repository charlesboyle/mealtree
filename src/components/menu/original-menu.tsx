"use client";

import { Sheet } from "@/components/sheet";
import { useI18n } from "@/i18n/client";
import { menuFileUrl } from "@/lib/format";
import type { MenuFiles } from "@/lib/types";

/** The original menu pages we built the listing from, so anyone can check a price against the source. */
export function OriginalMenuSheet({ files, open, onClose }: { files: MenuFiles; open: boolean; onClose: () => void }) {
  const { t, date } = useI18n();
  const pages = files.files;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t.menu.originalTitle}
      closeTone="surface"
      closeLabel={t.common.close}
      className="sm:max-w-[720px]"
      header={
        <div className="px-5 pb-3 pt-4">
          <h2 className="text-lg font-semibold tracking-tight text-ink">{t.menu.originalTitle}</h2>
          <p className="mt-0.5 text-sm text-ink-3">{t.menu.originalNote(date(files.received))}</p>
        </div>
      }
    >
      <div className="space-y-3 px-3 pb-8 sm:px-5">
        {pages.map((p, i) => (
          <figure key={p.path}>
            <a href={menuFileUrl(p.path)} target="_blank" rel="noopener" aria-label={t.menu.originalPage(i + 1, pages.length)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={menuFileUrl(p.path)}
                alt={t.menu.originalPage(i + 1, pages.length)}
                loading="lazy"
                className="w-full rounded-lg border border-line bg-surface-2"
              />
            </a>
            <figcaption className="mt-1 text-center text-xs text-ink-3">{t.menu.originalPage(i + 1, pages.length)}</figcaption>
          </figure>
        ))}
      </div>
    </Sheet>
  );
}
