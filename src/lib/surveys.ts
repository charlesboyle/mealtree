/**
 * PostHog "api" (headless) surveys. We render our own UI and send the three events PostHog expects:
 * `survey shown`, `survey sent` and `survey dismissed`. Everything here is pure so the payloads can be tested;
 * `sendSurvey` in track.ts does the capturing.
 *
 * Question texts stay in English (they are the survey definitions in PostHog) whatever language the UI is in.
 */

export const ORDER_FEEDBACK = {
  id: "01a1af25-9bf6-0000-2dac-c00d2bf788e4",
  placed: {
    id: "3f4c995a-c195-4cf6-882d-4f977174fa09",
    question: "Did you get to place your order?",
    choices: ["Yes", "Not yet", "Had a problem"],
  },
  comment: { id: "9c33cf2f-5f94-490c-a0f7-32fab5d7ac88", question: "Anything that could have been better?" },
} as const;

export const OWNER_INTEREST = {
  id: "01a1af25-a276-0000-1778-b56438156c5a",
  name: { id: "15cb2b22-e553-4ffb-9fe1-6daaf3ea51d7", question: "Your name" },
  role: {
    id: "577fbd34-c808-486d-abea-bf91656f2637",
    question: "Your role",
    choices: ["Owner", "Manager", "Staff", "Other"],
  },
  phone: { id: "57ef2415-a434-43f0-954d-eb6c458521bc", question: "Phone or WhatsApp number" },
  email: { id: "0b543699-5268-488f-b024-409416861ca6", question: "Email" },
  restaurant: { id: "6ef6dc64-9521-4e5e-aae8-0c4da9ad9c50", question: "Restaurant name" },
  note: { id: "d1190485-5bcb-4fb7-a04d-f9488347f6c3", question: "Anything you'd like to tell us?" },
} as const;

export type OrderChoice = (typeof ORDER_FEEDBACK.placed.choices)[number];
export type OwnerRole = (typeof OWNER_INTEREST.role.choices)[number];
export type OrderChannel = "whatsapp" | "call";
export type OwnerInterestSource = "restaurant_page" | "for_restaurants" | "claim_redirect";

/** A question as asked, with the response: text for open questions, a one-item list for single choice. */
export type SurveyAnswer = { id: string; question: string; response: string | string[] | null | undefined };

/** Trims, and turns an empty answer into null so it can be left out. */
function clean(response: SurveyAnswer["response"]) {
  if (Array.isArray(response)) {
    const items = response.map((r) => r.trim()).filter(Boolean);
    return items.length ? items : null;
  }
  return response?.trim() || null;
}

/** Properties of a `survey sent` event: the `$survey_*` keys, `$survey_response_<questionId>` per answer, and any extras. */
export type SurveySentProps = {
  $survey_id: string;
  $survey_submission_id: string;
  $survey_completed: true;
  $survey_questions: { id: string; question: string; response: string | string[] }[];
  [key: string]: unknown;
};

export function surveyShownProps(surveyId: string) {
  return { $survey_id: surveyId };
}

export const surveyDismissedProps = surveyShownProps;

/**
 * Properties of a `survey sent` event. Unanswered questions are left out entirely (no empty strings).
 * `extra` goes in first so it can never overwrite a `$survey_*` key; `undefined` extras are dropped.
 * `$survey_responded` is set by PostHog, not by us.
 */
export function surveySentProps({
  surveyId,
  submissionId,
  answers,
  extra = {},
}: {
  surveyId: string;
  submissionId: string;
  answers: SurveyAnswer[];
  extra?: Record<string, string | number | boolean | undefined>;
}): SurveySentProps {
  const answered = answers.flatMap((a) => {
    const response = clean(a.response);
    return response ? [{ id: a.id, question: a.question, response }] : [];
  });
  return {
    ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== undefined)),
    $survey_id: surveyId,
    $survey_submission_id: submissionId,
    $survey_completed: true,
    $survey_questions: answered,
    ...Object.fromEntries(answered.map((a) => [`$survey_response_${a.id}`, a.response])),
  };
}

/** One id per submission; `crypto.randomUUID` only exists on secure pages, so plain http (LAN testing) falls back. */
export function newSubmissionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const n = Math.floor(Math.random() * 16);
    return (c === "x" ? n : (n & 0x3) | 0x8).toString(16);
  });
}

export function orderFeedbackAnswers(choice: OrderChoice, comment: string): SurveyAnswer[] {
  const { placed, comment: q2 } = ORDER_FEEDBACK;
  return [
    { id: placed.id, question: placed.question, response: [choice] },
    { id: q2.id, question: q2.question, response: comment },
  ];
}

export type OwnerInterestForm = {
  name: string;
  role: OwnerRole;
  phone: string;
  email: string;
  restaurant: string;
  note: string;
};

export function ownerInterestAnswers(f: OwnerInterestForm): SurveyAnswer[] {
  const q = OWNER_INTEREST;
  return [
    { id: q.name.id, question: q.name.question, response: f.name },
    { id: q.role.id, question: q.role.question, response: [f.role] },
    { id: q.phone.id, question: q.phone.question, response: f.phone },
    { id: q.email.id, question: q.email.question, response: f.email },
    { id: q.restaurant.id, question: q.restaurant.question, response: f.restaurant },
    { id: q.note.id, question: q.note.question, response: f.note },
  ];
}

/** Fallback when PostHog can't be reached: the same answers as a prefilled email. */
export function ownerInterestMailto(to: string, f: OwnerInterestForm) {
  const body = ownerInterestAnswers(f)
    .flatMap((a) => {
      const response = clean(a.response);
      return response ? [`${a.question}: ${Array.isArray(response) ? response.join(", ") : response}`] : [];
    })
    .join("\n");
  const subject = `NOMM: manage my menu${f.restaurant.trim() ? ` (${f.restaurant.trim()})` : ""}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export type OwnerFormField = "name" | "role" | "phone" | "email" | "restaurant";
export type OwnerFormError = "required" | "chooseRole" | "phone" | "email";

/** Which fields to flag, and why. Name, role, phone and restaurant are required; email only has to look like one. */
export function ownerInterestErrors(f: Omit<OwnerInterestForm, "role" | "note"> & { role: OwnerRole | "" }) {
  const errors: Partial<Record<OwnerFormField, OwnerFormError>> = {};
  if (!f.name.trim()) errors.name = "required";
  if (!f.role) errors.role = "chooseRole";
  const phone = f.phone.trim();
  if (!phone) errors.phone = "required";
  else if (!/^[+\d\s()\-.]+$/.test(phone) || phone.replace(/\D/g, "").length < 7) errors.phone = "phone";
  const email = f.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "email";
  if (!f.restaurant.trim()) errors.restaurant = "required";
  return errors;
}
