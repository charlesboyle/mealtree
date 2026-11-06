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

export const RESTAURANT_SUGGESTION = {
  id: "01a1afa2-6c98-0000-6f9a-b070756e7edc",
  name: { id: "9df3a787-a741-4fbe-b900-66b2c7a80ffe", question: "Which restaurant are you looking for?" },
  phone: { id: "f1d2484e-3e53-47d3-921e-4d6fac8cb0f7", question: "Restaurant's WhatsApp number" },
  maps: { id: "b4dd40f1-b3bc-4f84-abaa-1a14fa4e3445", question: "Google Maps link" },
} as const;

export type OrderChoice = (typeof ORDER_FEEDBACK.placed.choices)[number];
export type OwnerRole = (typeof OWNER_INTEREST.role.choices)[number];
export type OrderChannel = "whatsapp" | "call";
export type SuggestionSource = "search" | "listing" | "not_found";
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

/** Digits with the usual separators, at least 7 of them. */
export function isValidPhone(phone: string) {
  return /^[+\d\s()\-.]+$/.test(phone.trim()) && phone.replace(/\D/g, "").length >= 7;
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
  else if (!isValidPhone(phone)) errors.phone = "phone";
  const email = f.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "email";
  if (!f.restaurant.trim()) errors.restaurant = "required";
  return errors;
}

export type RestaurantSuggestionForm = { name: string; phone: string; maps: string };
export type SuggestionError = "required" | "phoneRequired" | "phoneInvalid" | "mapsInvalid";

/** True for the link formats Google Maps hands out: google.com/maps (any country domain), maps.google.com, maps.app.goo.gl, goo.gl/maps, g.page. */
export function isGoogleMapsLink(input: string) {
  const text = input.trim();
  if (!text || /\s/.test(text)) return false;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "maps.app.goo.gl" || host === "g.page") return true;
  if (host === "goo.gl") return url.pathname.startsWith("/maps");
  if (/^maps\.google\.[a-z.]+$/.test(host)) return true;
  return /^google\.[a-z.]+$/.test(host) && url.pathname.startsWith("/maps");
}

export function restaurantSuggestionAnswers(f: RestaurantSuggestionForm): SurveyAnswer[] {
  const q = RESTAURANT_SUGGESTION;
  return [
    { id: q.name.id, question: q.name.question, response: f.name },
    { id: q.phone.id, question: q.phone.question, response: f.phone },
    { id: q.maps.id, question: q.maps.question, response: f.maps },
  ];
}

/** Fallback when PostHog can't be reached: the same answers as a prefilled email. */
export function restaurantSuggestionMailto(to: string, f: RestaurantSuggestionForm) {
  const body = restaurantSuggestionAnswers(f)
    .flatMap((a) => {
      const response = clean(a.response);
      return response ? [`${a.question}: ${Array.isArray(response) ? response.join(", ") : response}`] : [];
    })
    .join("\n");
  const subject = `NOMM: add ${f.name.trim() || "a restaurant"}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** The restaurant's name and phone number are required; the Google Maps link is optional but must be one if given. */
export function restaurantSuggestionErrors(f: RestaurantSuggestionForm) {
  const errors: Partial<Record<"name" | "phone" | "maps", SuggestionError>> = {};
  if (!f.name.trim()) errors.name = "required";
  if (!f.phone.trim()) errors.phone = "phoneRequired";
  else if (!isValidPhone(f.phone)) errors.phone = "phoneInvalid";
  if (f.maps.trim() && !isGoogleMapsLink(f.maps)) errors.maps = "mapsInvalid";
  return errors;
}
