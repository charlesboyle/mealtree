/**
 * "Did you get to place your order?" follow-up. Tapping WhatsApp or Call in the bag leaves a small flag in
 * localStorage; when the diner is back on the same restaurant's page (tab visible again, or a later visit) and
 * the flag is old enough, the feedback card asks. The flag holds only the restaurant, channel, time and item count.
 */
import type { OrderChannel } from "./surveys";

export const ORDER_FEEDBACK_KEY = "nomm:order-feedback-pending";
/** Too soon after the tap to ask: the diner is probably still in WhatsApp or on the call. */
export const FEEDBACK_MIN_DELAY_MS = 15_000;
/** After this the moment has passed, so the flag is dropped without asking. */
export const FEEDBACK_MAX_AGE_MS = 3 * 60 * 60 * 1000;
/** The card stays up this long after Send before closing itself. */
export const FEEDBACK_THANKS_MS = 2_500;

export type PendingFeedback = { slug: string; channel: OrderChannel; at: number; itemCount: number };

/** `none` nothing pending, `other` for another restaurant (left alone), `wait` too early, `due` ask now, `expired` drop it. */
export type FeedbackStatus = "none" | "other" | "wait" | "due" | "expired";

export function serializePending(p: PendingFeedback) {
  return JSON.stringify(p);
}

/** Null for anything that isn't a well-formed flag (missing, corrupt JSON, wrong shapes). */
export function parsePending(raw: string | null | undefined): PendingFeedback | null {
  if (!raw) return null;
  try {
    const d: unknown = JSON.parse(raw);
    if (!d || typeof d !== "object") return null;
    const { slug, channel, at, itemCount } = d as Record<string, unknown>;
    if (typeof slug !== "string" || !slug) return null;
    if (channel !== "whatsapp" && channel !== "call") return null;
    if (typeof at !== "number" || !Number.isFinite(at)) return null;
    if (typeof itemCount !== "number" || !Number.isFinite(itemCount)) return null;
    return { slug, channel, at, itemCount };
  } catch {
    return null;
  }
}

export function feedbackStatus(pending: PendingFeedback | null, now: number, slug: string): FeedbackStatus {
  if (!pending) return "none";
  if (pending.slug !== slug) return "other";
  const age = now - pending.at;
  if (age < 0 || age > FEEDBACK_MAX_AGE_MS) return "expired";
  return age >= FEEDBACK_MIN_DELAY_MS ? "due" : "wait";
}

export function shouldShowFeedback(pending: PendingFeedback | null, now: number, slug: string) {
  return feedbackStatus(pending, now, slug) === "due";
}

/** Milliseconds until a `wait` flag becomes due. */
export function feedbackDelay(pending: PendingFeedback, now: number) {
  return Math.max(0, pending.at + FEEDBACK_MIN_DELAY_MS - now);
}

// Storage access never throws: with storage blocked the card simply never appears.
export function readPending() {
  try {
    return parsePending(localStorage.getItem(ORDER_FEEDBACK_KEY));
  } catch {
    return null;
  }
}

export function writePending(p: PendingFeedback) {
  try {
    localStorage.setItem(ORDER_FEEDBACK_KEY, serializePending(p));
  } catch {}
}

export function clearPending() {
  try {
    localStorage.removeItem(ORDER_FEEDBACK_KEY);
  } catch {}
}
