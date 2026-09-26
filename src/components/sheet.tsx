"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";
import { useHydrated } from "@/lib/store";

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Bottom sheet on phones (drag the handle down to dismiss), centered dialog
 * from `sm` up. Content scrolls inside; the page behind is locked.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
  header,
  className,
  style,
  closeTone = "image",
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  /** Rendered above the scroll area and used as the drag handle on phones. */
  header?: React.ReactNode;
  className?: string;
  /** Portaled to <body>, so page-level CSS variables (accent) are passed here. */
  style?: React.CSSProperties;
  closeTone?: "image" | "surface";
}) {
  const hydrated = useHydrated();
  const desktop = useMediaQuery("(min-width: 640px)");
  const controls = useDragControls();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.documentElement.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!hydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" style={style} data-accent={style ? "" : undefined}>
          <motion.div
            className="absolute inset-0 bg-scrim backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              tabIndex={-1}
              className={cn(
                "pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-lg outline-none sm:max-h-[min(86dvh,820px)] sm:max-w-[520px] sm:rounded-[28px]",
                className,
              )}
              initial={desktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }}
              animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
              exit={
                desktop
                  ? { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18 } }
                  : { y: "100%", transition: { type: "spring", bounce: 0, duration: 0.32 } }
              }
              transition={{ type: "spring", bounce: desktop ? 0.2 : 0.12, duration: 0.5 }}
              drag={desktop ? false : "y"}
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.04, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 110 || info.velocity.y > 600) onClose();
              }}
            >
              <div
                className="relative shrink-0 touch-none sm:touch-auto"
                onPointerDown={(e) => !desktop && controls.start(e)}
              >
                <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-2 sm:hidden">
                  <span className="h-1 w-9 rounded-full bg-white/70 mix-blend-difference" />
                </div>
                {header}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className={cn(
                  "pressable absolute right-3 top-3 z-20 grid size-9 place-items-center rounded-full backdrop-blur-md",
                  closeTone === "image"
                    ? "bg-black/35 text-white hover:bg-black/50"
                    : "bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink",
                )}
              >
                <X className="size-[18px]" strokeWidth={2.2} />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
