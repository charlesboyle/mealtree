"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckMark } from "@/components/check-mark";
import { Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import { clearPending, FEEDBACK_THANKS_MS, feedbackDelay, feedbackStatus, type PendingFeedback, readPending } from "@/lib/order-feedback";
import { sendSurvey } from "@/lib/track";
import {
  newSubmissionId,
  ORDER_FEEDBACK,
  type OrderChoice,
  orderFeedbackAnswers,
  surveyDismissedProps,
  surveySentProps,
  surveyShownProps,
} from "@/lib/surveys";

const EASE = [0.23, 1, 0.32, 1] as const;
/** A small emoji on the two common answers; the "problem" answer stays plain so the row doesn't feel busy. */
const CHOICE_EMOJI: Partial<Record<OrderChoice, string>> = { Yes: "👍", "Not yet": "⏳" };

/**
 * "Did you get to place your order?" after the diner tapped WhatsApp or Call in the bag (see lib/order-feedback.ts).
 * Watches for the diner coming back to this restaurant's page, waits for any open sheet to close, then slides up
 * above the bag bar. Renders nothing on the server.
 */
export function OrderFeedbackCard({ slug, blocked, barVisible }: { slug: string; blocked: boolean; barVisible: boolean }) {
  const [due, setDue] = useState<PendingFeedback | null>(null);
  // Once on screen the card stays up even if a sheet opens over it; `blocked` only holds back its first appearance.
  const [shownAt, setShownAt] = useState<number | null>(null);
  const done = useCallback(() => {
    setDue(null);
    setShownAt(null);
  }, []);

  useEffect(() => {
    let wait: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      clearTimeout(wait);
      if (document.visibilityState !== "visible") return;
      const pending = readPending();
      const status = feedbackStatus(pending, Date.now(), slug);
      if (status === "expired") clearPending();
      else if (status === "due") setDue(pending);
      // Back before the minimum delay: ask once it has passed.
      else if (status === "wait" && pending) wait = setTimeout(check, feedbackDelay(pending, Date.now()) + 50);
    };
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", check);
    return () => {
      clearTimeout(wait);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", check);
    };
  }, [slug]);

  return (
    <AnimatePresence>
      {due && (!blocked || shownAt === due.at) && (
        <FeedbackCard key={due.at} due={due} barVisible={barVisible} onShown={setShownAt} onDone={done} />
      )}
    </AnimatePresence>
  );
}

function FeedbackCard({
  due,
  barVisible,
  onShown,
  onDone,
}: {
  due: PendingFeedback;
  barVisible: boolean;
  onShown: (at: number) => void;
  onDone: () => void;
}) {
  const { t, locale } = useI18n();
  const f = t.orderFeedback;
  const titleId = useId();
  const [choice, setChoice] = useState<OrderChoice | null>(null);
  const [comment, setComment] = useState("");
  const [thanked, setThanked] = useState(false);
  const answered = useRef(false);
  const announced = useRef(false);

  // On screen: the flag is spent (never asked twice), and PostHog is told.
  useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    clearPending();
    sendSurvey("survey shown", surveyShownProps(ORDER_FEEDBACK.id), due.slug);
    onShown(due.at);
  }, [due, onShown]);

  useEffect(() => {
    if (!thanked) return;
    const id = setTimeout(onDone, FEEDBACK_THANKS_MS);
    return () => clearTimeout(id);
  }, [thanked, onDone]);

  const close = () => {
    if (!answered.current) sendSurvey("survey dismissed", surveyDismissedProps(ORDER_FEEDBACK.id), due.slug);
    answered.current = true;
    onDone();
  };

  const send = () => {
    if (!choice || answered.current) return;
    answered.current = true;
    sendSurvey(
      "survey sent",
      surveySentProps({
        surveyId: ORDER_FEEDBACK.id,
        submissionId: newSubmissionId(),
        answers: orderFeedbackAnswers(choice, comment),
        extra: { restaurant_slug: due.slug, channel: due.channel, locale, item_count: due.itemCount },
      }),
      due.slug,
    );
    setThanked(true);
  };

  return (
    <>
      {/* Blurred fade from the bottom of the screen (under the bag bar and the card, z-40); a tap anywhere outside the card closes it. */}
      <motion.div
        aria-hidden
        onClick={close}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE } }}
        transition={{ duration: 0.3, ease: EASE }}
        className="fixed inset-0 z-[35]"
      >
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-ink/30 via-ink/10 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_top,black_15%,transparent)]" />
      </motion.div>
      {/* The card sits just above the bag bar (56px tall, 12px gap) and below the sheets (z-50). */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4 md:justify-end md:px-8",
          barVisible
            ? "bottom-[calc(max(16px,env(safe-area-inset-bottom))+68px)] md:bottom-[calc(2rem+68px)]"
            : "bottom-[max(16px,env(safe-area-inset-bottom))] md:bottom-8",
        )}
      >
        <motion.section
          aria-labelledby={titleId}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18, ease: EASE } }}
          transition={{ duration: 0.3, ease: EASE }}
          onKeyDown={(e) => e.key === "Escape" && close()}
          className="pointer-events-auto relative w-full max-w-sm rounded-3xl border border-line bg-surface p-4 shadow-bag"
        >
          {thanked ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" className="flex items-center gap-3 pe-11">
              <CheckMark className="size-10 shrink-0" />
              <p id={titleId} className="text-[15px] font-semibold leading-snug text-plum">
                {f.thanks}
              </p>
            </motion.div>
          ) : (
            <>
              <h2 id={titleId} className="pe-11 text-[15px] font-semibold leading-snug text-plum">
                {f.title}
              </h2>
              <div role="group" aria-labelledby={titleId} className="mt-3 grid grid-cols-2 gap-2">
                {ORDER_FEEDBACK.placed.choices.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={choice === c}
                    onClick={() => setChoice(c)}
                    className={cn(
                      "pressable flex min-h-12 items-center justify-center gap-2 rounded-full border px-3 py-2 text-center text-sm font-medium leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
                      c === "Had a problem" && "col-span-2",
                      choice === c ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40",
                    )}
                  >
                    {CHOICE_EMOJI[c] && <span aria-hidden>{CHOICE_EMOJI[c]}</span>}
                    {f.choices[c]}
                  </button>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {choice && (
                  <motion.div
                    key="more"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <label className="block pt-3">
                      <span className="text-[13px] font-medium text-plum">{f.comment}</span>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={2}
                        placeholder={f.placeholder}
                        className="mt-1.5 min-h-16 w-full resize-none rounded-xl bg-plum/[0.05] px-4 py-3 text-md text-plum outline-none transition-colors duration-150 placeholder:text-muted focus:bg-plum/[0.08]"
                      />
                    </label>
                    <Button type="button" variant="primary" onClick={send} className="mt-3 w-full">
                      {f.send}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          <button
            type="button"
            onClick={close}
            aria-label={t.common.close}
            className="absolute end-1.5 top-1.5 grid size-11 place-items-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <X className="size-4" />
          </button>
        </motion.section>
      </div>
    </>
  );
}
