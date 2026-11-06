import { describe, expect, it } from "vitest";
import {
  FEEDBACK_MAX_AGE_MS,
  FEEDBACK_MIN_DELAY_MS,
  feedbackDelay,
  feedbackStatus,
  parsePending,
  serializePending,
  shouldShowFeedback,
} from "./order-feedback";

const NOW = 1_800_000_000_000;
const pending = (ageMs: number, slug = "tea-spot") => ({ slug, channel: "whatsapp" as const, at: NOW - ageMs, itemCount: 2 });

describe("shouldShowFeedback", () => {
  it("waits until the minimum delay has passed", () => {
    expect(shouldShowFeedback(pending(FEEDBACK_MIN_DELAY_MS - 1), NOW, "tea-spot")).toBe(false);
    expect(feedbackStatus(pending(1000), NOW, "tea-spot")).toBe("wait");
    expect(shouldShowFeedback(pending(FEEDBACK_MIN_DELAY_MS), NOW, "tea-spot")).toBe(true);
  });

  it("shows up to the maximum age, then expires", () => {
    expect(shouldShowFeedback(pending(FEEDBACK_MAX_AGE_MS), NOW, "tea-spot")).toBe(true);
    expect(shouldShowFeedback(pending(FEEDBACK_MAX_AGE_MS + 1), NOW, "tea-spot")).toBe(false);
    expect(feedbackStatus(pending(FEEDBACK_MAX_AGE_MS + 1), NOW, "tea-spot")).toBe("expired");
  });

  it("ignores another restaurant's flag without expiring it", () => {
    expect(feedbackStatus(pending(60_000, "other"), NOW, "tea-spot")).toBe("other");
    expect(shouldShowFeedback(pending(60_000, "other"), NOW, "tea-spot")).toBe(false);
  });

  it("treats a missing flag as nothing to do and a future timestamp as expired", () => {
    expect(feedbackStatus(null, NOW, "tea-spot")).toBe("none");
    expect(feedbackStatus(pending(-5000), NOW, "tea-spot")).toBe("expired");
  });

  it("reports how long a too-early flag still has to wait", () => {
    expect(feedbackDelay(pending(5000), NOW)).toBe(FEEDBACK_MIN_DELAY_MS - 5000);
    expect(feedbackDelay(pending(FEEDBACK_MIN_DELAY_MS * 2), NOW)).toBe(0);
  });
});

describe("parsePending / serializePending", () => {
  it("round-trips a flag", () => {
    const p = pending(0);
    expect(parsePending(serializePending(p))).toEqual(p);
  });

  it("returns null for missing, corrupt or malformed values", () => {
    for (const raw of [null, undefined, "", "{", "nope", "null", "42", "[]", '{"slug":"a"}']) {
      expect(parsePending(raw)).toBeNull();
    }
    expect(parsePending(JSON.stringify({ ...pending(0), channel: "sms" }))).toBeNull();
    expect(parsePending(JSON.stringify({ ...pending(0), at: "yesterday" }))).toBeNull();
    expect(parsePending(JSON.stringify({ ...pending(0), itemCount: null }))).toBeNull();
  });
});
