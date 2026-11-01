"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";
import { menuFileUrl } from "@/lib/format";
import type { MenuFiles } from "@/lib/types";

const EASE = [0.23, 1, 0.32, 1] as const;
const navBtn =
  "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-[background-color,opacity] duration-150 hover:bg-white/20 active:scale-95 disabled:pointer-events-none disabled:opacity-0";

/** Full-screen viewer for the original menu pages. Swipe, arrows or keys to page. */
export function OriginalMenuSheet({ files, open, onClose }: { files: MenuFiles; open: boolean; onClose: () => void }) {
  const { t, date } = useI18n();
  const pages = files.files;
  const count = pages.length;
  const [index, setIndex] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setIndex(0);
  }
  const go = (delta: number) => setIndex((i) => Math.min(count - 1, Math.max(0, i + delta)));

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(count - 1, i + 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, count]);

  const label = t.menu.originalPage(index + 1, count);
  return (
    <AnimatePresence>
      {open && count > 0 && (
        <motion.div
          key="menu-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={t.menu.originalTitle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="fixed inset-0 z-50 flex flex-col bg-[#141012]"
        >
          <div className="flex items-center justify-between px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))] text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t.menu.originalTitle}</p>
              <p className="text-xs text-white/60">
                {label} · {t.menu.originalNote(date(files.received))}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.img
                key={pages[index].path}
                src={menuFileUrl(pages[index].path)}
                alt={label}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE }}
                drag={count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.4}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) go(1);
                  if (info.offset.x > 60) go(-1);
                }}
                className="max-h-full max-w-full touch-pan-y select-none rounded-lg object-contain"
                draggable={false}
              />
            </AnimatePresence>
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  disabled={index === 0}
                  aria-label={t.menu.prevPage}
                  className={`absolute left-3 hidden sm:flex ${navBtn}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={index === count - 1}
                  aria-label={t.menu.nextPage}
                  className={`absolute right-3 hidden sm:flex ${navBtn}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex justify-center gap-1.5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4" dir="ltr">
            {pages.map((p, i) => (
              <button
                key={p.path}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t.menu.originalPage(i + 1, count)}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-[width,background-color] duration-200 ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
