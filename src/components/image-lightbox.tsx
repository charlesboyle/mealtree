"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/client";
import { photoSrcSet, photoUrl } from "@/lib/format";

/** Full-screen photo, uncropped. Click anywhere, press Esc or tap the close button to dismiss. */
export function ImageLightbox({ id, alt, open, onClose }: { id?: string; alt: string; open: boolean; onClose: () => void }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    // Capture phase, so Esc closes only the photo and not the sheet underneath.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (typeof document === "undefined" || !id) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] grid cursor-zoom-out place-items-center bg-black/90 p-3 sm:p-8"
        >
          <motion.img
            initial={{ scale: 0.94 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.94 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            src={photoUrl(id, 1600)}
            srcSet={photoSrcSet(id, 1600)}
            alt={alt}
            className="max-h-full max-w-full rounded-xl object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="absolute end-3 top-[max(12px,env(safe-area-inset-top))] flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <X className="size-5" aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
