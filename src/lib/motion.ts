/**
 * The site's motion pattern, in one place: things arrive by scaling up from slightly small while fading in,
 * and leave the same way in reverse (scale down, fade out). Anything pressable gives a small scale-down
 * while pressed. With reduced motion, callers skip movement and keep at most a fade.
 */

/** Springs for arrivals and settling: quick, low bounce. */
export const SPRING = { type: "spring", duration: 0.4, bounce: 0.25 } as const;

/** Exits are short and accelerate away. */
export const EXIT = { duration: 0.2, ease: [0.4, 0, 1, 1] } as const;

/** The state things arrive from and leave to. */
export const HIDDEN = { opacity: 0, scale: 0.92 } as const;
export const SHOWN = { opacity: 1, scale: 1 } as const;

/** Pressed state for buttons, pills and cards. */
export const PRESS_SPRING = { type: "spring", duration: 0.25, bounce: 0.3 } as const;
export function pressable(reduced: boolean | null, scale = 0.95) {
  return reduced ? {} : { whileTap: { scale, transition: PRESS_SPRING } };
}

/** Enter/exit props for something shown and hidden with AnimatePresence. */
export function popInOut(reduced: boolean | null) {
  return reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : { initial: HIDDEN, animate: SHOWN, exit: { ...HIDDEN, transition: EXIT }, transition: SPRING };
}
