"use client";

import { ActionText } from "@/components/action-text";
import { AlertTriangle, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { CheckMark } from "@/components/check-mark";
import { openMenuForm } from "@/components/menu-submission-form";
import { Sheet } from "@/components/sheet";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import { sendSurvey } from "@/lib/track";
import {
  newSubmissionId,
  RESTAURANT_SUGGESTION,
  restaurantSuggestionAnswers,
  restaurantSuggestionErrors,
  restaurantSuggestionMailto,
  type SuggestionError,
  type SuggestionSource,
  surveyDismissedProps,
  surveySentProps,
  surveyShownProps,
} from "@/lib/surveys";

const FIELD =
  "mt-1.5 w-full rounded-xl bg-plum/[0.05] px-4 text-md text-plum outline-none transition-colors duration-150 placeholder:text-muted focus:bg-plum/[0.08] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger";

/**
 * "Missing a restaurant? Tell us": a text button that opens the diner suggestion form, a PostHog api survey in a
 * sheet. `initialName` prefills what the diner searched for; `source` says where they were when they gave up.
 */
export function SuggestRestaurant({
  source,
  initialName = "",
  className,
}: {
  source: SuggestionSource;
  initialName?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const sent = useRef(false);

  const show = () => {
    sent.current = false;
    sendSurvey("survey shown", surveyShownProps(RESTAURANT_SUGGESTION.id));
    setOpen(true);
  };
  // Stable: the sheet re-binds its keyboard handling (and refocuses) whenever this changes.
  const close = useCallback(() => {
    if (!sent.current) sendSurvey("survey dismissed", surveyDismissedProps(RESTAURANT_SUGGESTION.id));
    sent.current = true; // a second close (e.g. Escape during the exit animation) reports nothing
    setOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={show}
        className={cn(
          "font-medium transition-colors duration-150 hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
          className,
        )}
      >
        <ActionText text={t.suggest.cta} />
      </button>
      <Sheet
        open={open}
        onClose={close}
        label={t.suggest.title}
        look="modal"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
        <Body
          source={source}
          initialName={initialName}
          onClose={close}
          onSent={() => {
            sent.current = true;
          }}
          onOwner={(v) => {
            close();
            openMenuForm({ source: "suggest", restaurant: v.name.trim() || undefined, maps: v.maps.trim() || undefined });
          }}
        />
      </Sheet>
    </>
  );
}

function Body({
  source,
  initialName,
  onClose,
  onSent,
  onOwner,
}: {
  source: SuggestionSource;
  initialName: string;
  onClose: () => void;
  onSent: () => void;
  /** "I'm the owner": swap to the owner menu form, carrying over what was typed. */
  onOwner: (values: { name: string; maps: string }) => void;
}) {
  const { t, locale } = useI18n();
  const f = t.suggest;
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const mapsRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({ name: initialName, phone: "", maps: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "phone" | "maps", SuggestionError>>>({});
  const [result, setResult] = useState<{ delivered: boolean; mailto: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = restaurantSuggestionErrors(values);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (found.phone) return phoneRef.current?.focus();
    if (found.maps) return mapsRef.current?.focus();
    const delivered = sendSurvey(
      "survey sent",
      surveySentProps({
        surveyId: RESTAURANT_SUGGESTION.id,
        submissionId: newSubmissionId(),
        answers: restaurantSuggestionAnswers(values),
        extra: { locale, source },
      }),
    );
    onSent();
    setResult({ delivered, mailto: restaurantSuggestionMailto(CONTACT_EMAIL, values) });
  };

  const header = (
    <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{f.title}</h2>
        <p className="text-sm text-muted">{f.lead}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.common.close}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft text-ink transition-colors duration-150 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );

  if (result) {
    const ok = result.delivered;
    return (
      <div>
        {header}
        <div className="flex flex-col items-center px-6 pb-4 pt-6 text-center" role={ok ? "status" : "alert"}>
          {ok ? (
            <CheckMark />
          ) : (
            <span className="grid size-14 place-items-center rounded-full bg-danger/10 text-danger">
              <AlertTriangle className="size-7" aria-hidden />
            </span>
          )}
          <h3 className="mt-4 text-lg font-semibold text-ink">{ok ? f.doneTitle : f.offlineTitle}</h3>
          <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-muted">{ok ? f.done : f.offlineBody}</p>
          <div className="mt-6 flex w-full flex-col gap-2">
            {ok ? (
              <Button variant="primary" onClick={onClose} className="w-full">
                {f.doneButton}
              </Button>
            ) : (
              <>
                <Button variant="primary" onClick={() => setResult(null)} className="w-full">
                  {f.offlineRetry}
                </Button>
                <a
                  href={result.mailto}
                  className="pressable inline-flex h-12 items-center justify-center rounded-full bg-soft px-6 text-base font-semibold text-ink hover:bg-line"
                >
                  {f.offlineCta}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <form onSubmit={submit} noValidate className="space-y-4 px-5 pb-2 pt-3">
        <div>
          <label htmlFor={`${uid}-name`} className="text-[13px] font-medium text-plum">
            {f.name}
          </label>
          <input
            ref={nameRef}
            id={`${uid}-name`}
            value={values.name}
            onChange={(e) => {
              setValues((v) => ({ ...v, name: e.target.value }));
              setErrors((x) => ({ ...x, name: undefined }));
            }}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            enterKeyHint="next"
            className={cn(FIELD, "h-12")}
          />
          {errors.name && (
            <p id={`${uid}-name-error`} className="mt-1.5 text-[13px] font-medium text-danger">
              {f.errors[errors.name]}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-phone`} className="text-[13px] font-medium text-plum">
            {f.phone}
          </label>
          <input
            ref={phoneRef}
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="off"
            value={values.phone}
            onChange={(e) => {
              setValues((v) => ({ ...v, phone: e.target.value }));
              setErrors((x) => ({ ...x, phone: undefined }));
            }}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={`${uid}-phone-hint${errors.phone ? ` ${uid}-phone-error` : ""}`}
            enterKeyHint="next"
            className={cn(FIELD, "h-12")}
          />
          <p id={`${uid}-phone-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
            {f.phoneHint}
          </p>
          {errors.phone && (
            <p id={`${uid}-phone-error`} className="mt-1.5 text-[13px] font-medium text-danger">
              {f.errors[errors.phone]}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${uid}-maps`} className="text-[13px] font-medium text-plum">
            {f.maps}
            <span className="ms-1.5 font-normal text-muted">({f.optional})</span>
          </label>
          <input
            ref={mapsRef}
            id={`${uid}-maps`}
            type="url"
            inputMode="url"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={values.maps}
            onChange={(e) => {
              setValues((v) => ({ ...v, maps: e.target.value }));
              setErrors((x) => ({ ...x, maps: undefined }));
            }}
            aria-invalid={errors.maps ? true : undefined}
            aria-describedby={`${uid}-maps-hint${errors.maps ? ` ${uid}-maps-error` : ""}`}
            placeholder={f.mapsPlaceholder}
            enterKeyHint="send"
            className={cn(FIELD, "h-12")}
          />
          <p id={`${uid}-maps-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
            {f.mapsHint}
          </p>
          {errors.maps && (
            <p id={`${uid}-maps-error`} className="mt-1.5 text-[13px] font-medium text-danger">
              {f.errors[errors.maps]}
            </p>
          )}
        </div>
        <div>
          <Button type="submit" variant="primary" className="w-full">
            {f.submit}
          </Button>
          <p className="mt-1 text-center text-sm text-muted">
            <button
              type="button"
              onClick={() => onOwner(values)}
              className="inline-flex min-h-11 items-center font-medium text-plum underline decoration-dashed decoration-1 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              {t.menuForm.imOwner}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
