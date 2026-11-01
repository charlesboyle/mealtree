"use client";

import { AnimatePresence, motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";
import { useHydrated } from "@/lib/store";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  footer,
  className,
  style,
  closeTone = "image",
  closeLabel = "Close",
  look = "sheet",
  dragToClose,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
  /** Rendered above the scroll area and used as the drag handle on phones. */
  header?: React.ReactNode;
  /** Pinned below the scroll area (actions that must stay in reach). */
  footer?: React.ReactNode;
  className?: string;
  /** Portaled to <body>, so page-level CSS variables (accent) are passed here. */
  style?: React.CSSProperties;
  closeTone?: "image" | "surface";
  closeLabel?: string;
  /**
   * `sheet` is the standard bottom sheet. `modal` and `viewer` give the content full control of the
   * panel's look (close button, handle, classes) and keep only the dialog behavior: scroll lock,
   * Escape, focus trap. `modal` fades the scrim and slides the panel up 40px; `viewer` is a bare fade.
   */
  look?: "sheet" | "modal" | "viewer";
  /** `modal` only: drag the panel down to dismiss. */
  dragToClose?: boolean;
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      // Keep Tab inside the dialog.
      const root = panel.current;
      if (!root) return;
      const focusable = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!focusable.length) return e.preventDefault();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => panel.current?.focus({ preventScroll: true }));
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!hydrated) return null;

  if (look !== "sheet") {
    const EASE = [0.23, 1, 0.32, 1] as const;
    return createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            className={look === "viewer" ? "fixed inset-0 z-50" : "fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"}
            style={style}
            data-accent={style ? "" : undefined}
            exit={{ opacity: 1 }}
          >
            {look === "modal" && (
              <motion.div
                className="absolute inset-0 bg-ink/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                onClick={onClose}
                aria-hidden
              />
            )}
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              tabIndex={-1}
              {...(look === "modal"
                ? {
                    // Phones slide the panel up from the bottom edge and back down; larger screens ease it in place.
                    ...(desktop
                      ? {
                          initial: { y: 24, opacity: 0, scale: 0.97 },
                          animate: { y: 0, opacity: 1, scale: 1 },
                          exit: { y: 16, opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: EASE } },
                          transition: { type: "spring" as const, duration: 0.4, bounce: 0.1 },
                        }
                      : {
                          initial: { y: "105%" },
                          animate: { y: 0 },
                          exit: { y: "105%", transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const } },
                          transition: { type: "spring" as const, duration: 0.45, bounce: 0.06 },
                        }),
                  }
                : {})}
              {...(look === "modal" && dragToClose
                ? {
                    drag: "y" as const,
                    dragConstraints: { top: 0, bottom: 0 },
                    dragElastic: { top: 0, bottom: 0.6 },
                    onDragEnd: (_: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
                      if (info.offset.y > 100 || info.velocity.y > 600) onClose();
                    },
                  }
                : {})}
              className={cn("outline-none", look === "viewer" ? "absolute inset-0" : "relative", className)}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" style={style} data-accent={style ? "" : undefined}>
          <motion.div
            className="absolute inset-0 bg-scrim"
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
                "pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-lg outline-none sm:max-h-[min(86dvh,820px)] sm:max-w-[520px] sm:rounded-2xl",
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
                  <span className="h-1 w-9 rounded-full bg-ink-3/50" />
                </div>
                {header}
              </div>
              <button
                onClick={onClose}
                aria-label={closeLabel}
                className={cn(
                  "pressable absolute end-3 top-3 z-20 grid size-11 place-items-center rounded-full",
                  closeTone === "image"
                    ? "bg-black/45 text-white hover:bg-black/60"
                    : "bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink",
                )}
              >
                <X className="size-[18px]" strokeWidth={2.2} />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
              {footer && <div className="shrink-0">{footer}</div>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
