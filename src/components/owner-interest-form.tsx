"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckMark } from "@/components/check-mark";
import { Sheet } from "@/components/sheet";
import { CONTACT_EMAIL } from "@/components/site-footer";
import { Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import { sendSurvey } from "@/lib/track";
import {
  newSubmissionId,
  OWNER_INTEREST,
  type OwnerFormError,
  type OwnerFormField,
  type OwnerInterestSource,
  ownerInterestAnswers,
  ownerInterestErrors,
  ownerInterestMailto,
  type OwnerRole,
  surveyDismissedProps,
  surveySentProps,
  surveyShownProps,
} from "@/lib/surveys";

const FIELD =
  "mt-1.5 w-full rounded-xl bg-plum/[0.05] px-4 text-md text-plum outline-none transition-colors duration-150 placeholder:text-muted focus:bg-plum/[0.08] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger";
const FIELD_ORDER: OwnerFormField[] = ["name", "role", "phone", "email", "restaurant"];

/**
 * "Manage this menu": the owner interest form, a PostHog api survey in a sheet. `restaurant` is set when opened
 * from a restaurant page (its name is prefilled); on /for-restaurants the diner types it. `source` says where the
 * diner came from. Reports shown / sent / dismissed, and offers an email fallback when PostHog isn't reachable.
 */
export function OwnerInterestForm({
  open,
  onClose,
  source,
  restaurant,
  style,
}: {
  open: boolean;
  onClose: () => void;
  source: OwnerInterestSource;
  restaurant?: { slug: string; name: string };
  style?: React.CSSProperties;
}) {
  const { t } = useI18n();
  const sent = useRef(false);
  const slug = restaurant?.slug;

  useEffect(() => {
    if (!open) return;
    sent.current = false;
    sendSurvey("survey shown", surveyShownProps(OWNER_INTEREST.id), slug);
  }, [open, slug]);

  // Stable: the sheet re-binds its keyboard handling (and refocuses) whenever this changes.
  const close = useCallback(() => {
    if (!sent.current) sendSurvey("survey dismissed", surveyDismissedProps(OWNER_INTEREST.id), slug);
    sent.current = true; // a second close (e.g. Escape during the exit animation) reports nothing
    onClose();
  }, [slug, onClose]);

  return (
    <Sheet
      open={open}
      onClose={close}
      label={restaurant ? t.ownerForm.title : t.ownerForm.titleGeneric}
      look="modal"
      style={style}
      className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
    >
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <Body
        restaurant={restaurant}
        source={source}
        onClose={close}
        onSent={() => {
          sent.current = true;
        }}
      />
    </Sheet>
  );
}

function Body({
  restaurant,
  source,
  onClose,
  onSent,
}: {
  restaurant?: { slug: string; name: string };
  source: OwnerInterestSource;
  onClose: () => void;
  onSent: () => void;
}) {
  const { t, locale } = useI18n();
  const f = t.ownerForm;
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ name: "", role: "" as OwnerRole | "", phone: "", email: "", restaurant: restaurant?.name ?? "", note: "" });
  const [errors, setErrors] = useState<Partial<Record<OwnerFormField, OwnerFormError>>>({});
  const [result, setResult] = useState<{ delivered: boolean; mailto: string } | null>(null);

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = ownerInterestErrors(values);
    setErrors(found);
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) return formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
    const form = { ...values, role: values.role as OwnerRole };
    const delivered = sendSurvey(
      "survey sent",
      surveySentProps({
        surveyId: OWNER_INTEREST.id,
        submissionId: newSubmissionId(),
        answers: ownerInterestAnswers(form),
        extra: { restaurant_slug: restaurant?.slug, locale, source },
      }),
      restaurant?.slug,
    );
    onSent();
    setResult({ delivered, mailto: ownerInterestMailto(CONTACT_EMAIL, form) });
  };

  const header = (
    <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{restaurant ? f.title : f.titleGeneric}</h2>
        <p className={cn("text-sm text-muted", restaurant && "truncate")}>{restaurant ? restaurant.name : f.lead}</p>
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
        <div className="flex flex-col items-center px-6 pb-4 pt-6 text-center" role="status">
          {ok && <CheckMark />}
          <h3 className="mt-4 text-lg font-semibold text-ink">{ok ? f.doneTitle : f.offlineTitle}</h3>
          <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-muted">{ok ? f.done : f.offlineBody}</p>
          <div className="mt-6 flex w-full flex-col gap-2">
            {!ok && (
              <a
                href={result.mailto}
                className="pressable inline-flex h-12 items-center justify-center rounded-full bg-ink px-6 text-base font-semibold text-bg hover:opacity-90"
              >
                {f.offlineCta}
              </a>
            )}
            <Button variant={ok ? "primary" : "secondary"} onClick={onClose} className="w-full">
              {f.doneButton}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const errorText = (field: OwnerFormField) => (errors[field] ? f.errors[errors[field]!] : undefined);
  const field = (key: OwnerFormField) => ({
    id: `${uid}-${key}`,
    "data-field": key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${uid}-${key}-error` : undefined,
  });

  return (
    <div>
      {header}
      <form ref={formRef} onSubmit={submit} noValidate className="space-y-4 px-5 pb-2 pt-3">
        <Field id={`${uid}-name`} label={f.name} error={errorText("name")}>
          <input {...field("name")} value={values.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" enterKeyHint="next" className={cn(FIELD, "h-12")} />
        </Field>

        <div>
          <span id={`${uid}-role-label`} className="text-[13px] font-medium text-plum">
            {f.role}
          </span>
          <div
            role="group"
            aria-labelledby={`${uid}-role-label`}
            aria-describedby={errors.role ? `${uid}-role-error` : undefined}
            className="mt-1.5 flex flex-wrap gap-2"
          >
            {OWNER_INTEREST.role.choices.map((choice, i) => (
              <button
                key={choice}
                type="button"
                data-field={i === 0 ? "role" : undefined}
                aria-pressed={values.role === choice}
                onClick={() => set("role", choice)}
                className={cn(
                  "pressable flex h-11 items-center rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink",
                  values.role === choice
                    ? "border-ink bg-ink text-white"
                    : cn("bg-white text-ink hover:border-ink/40", errors.role ? "border-danger" : "border-line"),
                )}
              >
                {f.roles[choice]}
              </button>
            ))}
          </div>
          {errors.role && <ErrorText id={`${uid}-role-error`}>{errorText("role")}</ErrorText>}
        </div>

        <Field id={`${uid}-phone`} label={f.phone} error={errorText("phone")}>
          <input
            {...field("phone")}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            enterKeyHint="next"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={cn(FIELD, "h-12")}
          />
        </Field>

        <Field id={`${uid}-email`} label={f.email} optional={f.optional} error={errorText("email")}>
          <input
            {...field("email")}
            type="email"
            inputMode="email"
            dir="ltr"
            autoComplete="email"
            enterKeyHint="next"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            className={cn(FIELD, "h-12")}
          />
        </Field>

        <Field id={`${uid}-restaurant`} label={f.restaurant} error={errorText("restaurant")}>
          <input
            {...field("restaurant")}
            value={values.restaurant}
            onChange={(e) => set("restaurant", e.target.value)}
            autoComplete="organization"
            enterKeyHint="next"
            className={cn(FIELD, "h-12", restaurant && "bg-plum/[0.03] text-ink-2 focus:text-plum")}
          />
        </Field>

        <Field id={`${uid}-note`} label={f.note} optional={f.optional}>
          <textarea
            id={`${uid}-note`}
            value={values.note}
            onChange={(e) => set("note", e.target.value)}
            rows={3}
            placeholder={f.notePlaceholder}
            className={cn(FIELD, "min-h-24 resize-none py-3")}
          />
        </Field>

        <Button type="submit" variant="primary" className="w-full">
          {f.submit}
        </Button>
        <p className="pb-2 text-center text-xs leading-relaxed text-muted">{f.privacy}</p>
      </form>
    </div>
  );
}

function Field({ id, label, optional, error, children }: { id: string; label: string; optional?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-plum">
        {label}
        {optional && <span className="ms-1.5 font-normal text-muted">({optional})</span>}
      </label>
      {children}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[13px] font-medium text-danger">
      {children}
    </p>
  );
}
