import { describe, expect, it } from "vitest";
import {
  ORDER_FEEDBACK,
  OWNER_INTEREST,
  newSubmissionId,
  orderFeedbackAnswers,
  ownerInterestAnswers,
  ownerInterestErrors,
  ownerInterestMailto,
  surveyDismissedProps,
  surveySentProps,
  surveyShownProps,
} from "./surveys";

const sent = (comment: string, extra = {}) =>
  surveySentProps({
    surveyId: ORDER_FEEDBACK.id,
    submissionId: "sub-1",
    answers: orderFeedbackAnswers("Not yet", comment),
    extra,
  });

describe("surveySentProps", () => {
  it("sends the single choice as an array of one string", () => {
    const p = sent("");
    expect(p.$survey_questions[0]).toEqual({
      id: ORDER_FEEDBACK.placed.id,
      question: "Did you get to place your order?",
      response: ["Not yet"],
    });
    expect(p[`$survey_response_${ORDER_FEEDBACK.placed.id}`]).toEqual(["Not yet"]);
  });

  it("omits unanswered optional questions everywhere", () => {
    for (const blank of ["", "   \n"]) {
      const p = sent(blank);
      expect(p.$survey_questions).toHaveLength(1);
      expect(Object.keys(p)).not.toContain(`$survey_response_${ORDER_FEEDBACK.comment.id}`);
      expect(JSON.stringify(p)).not.toContain('""');
    }
  });

  it("adds a $survey_response_<id> property per answer, trimmed", () => {
    const p = sent("  Slow reply  ");
    expect(p[`$survey_response_${ORDER_FEEDBACK.comment.id}`]).toBe("Slow reply");
    expect(p.$survey_questions[1]).toEqual({
      id: ORDER_FEEDBACK.comment.id,
      question: "Anything that could have been better?",
      response: "Slow reply",
    });
  });

  it("marks the survey completed and never sets $survey_responded", () => {
    const p = sent("x");
    expect(p).toMatchObject({ $survey_id: ORDER_FEEDBACK.id, $survey_completed: true });
    expect(p).not.toHaveProperty("$survey_responded");
  });

  it("uses the submission id it is given, so each submission is distinct", () => {
    const a = surveySentProps({ surveyId: "s", submissionId: newSubmissionId(), answers: [] });
    const b = surveySentProps({ surveyId: "s", submissionId: newSubmissionId(), answers: [] });
    expect(a.$survey_submission_id).not.toBe(b.$survey_submission_id);
    expect(a.$survey_submission_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(sent("").$survey_submission_id).toBe("sub-1");
  });

  it("includes extra properties, drops undefined ones, and cannot override survey keys", () => {
    const p = sent("", { restaurant_slug: "tea-spot", channel: "call", item_count: 3, locale: undefined, $survey_id: "evil" });
    expect(p).toMatchObject({ restaurant_slug: "tea-spot", channel: "call", item_count: 3, $survey_id: ORDER_FEEDBACK.id });
    expect(p).not.toHaveProperty("locale");
  });
});

describe("ownerInterestAnswers", () => {
  const form = { name: "Sara", role: "Manager" as const, phone: "+971500000000", email: "", restaurant: "Tea Spot", note: "" };

  it("leaves out the optional email and note when empty", () => {
    const p = surveySentProps({ surveyId: OWNER_INTEREST.id, submissionId: "s", answers: ownerInterestAnswers(form) });
    expect(p.$survey_questions.map((q) => q.id)).toEqual([
      OWNER_INTEREST.name.id,
      OWNER_INTEREST.role.id,
      OWNER_INTEREST.phone.id,
      OWNER_INTEREST.restaurant.id,
    ]);
    expect(p[`$survey_response_${OWNER_INTEREST.role.id}`]).toEqual(["Manager"]);
    expect(p[`$survey_response_${OWNER_INTEREST.name.id}`]).toBe("Sara");
  });

  it("includes email and note once filled in", () => {
    const p = surveySentProps({
      surveyId: OWNER_INTEREST.id,
      submissionId: "s",
      answers: ownerInterestAnswers({ ...form, email: "a@b.co", note: "Hi" }),
    });
    expect(p[`$survey_response_${OWNER_INTEREST.email.id}`]).toBe("a@b.co");
    expect(p[`$survey_response_${OWNER_INTEREST.note.id}`]).toBe("Hi");
    expect(p.$survey_questions).toHaveLength(6);
  });

  it("builds a mailto with the answered questions in the body", () => {
    const href = ownerInterestMailto("hello@example.com", form);
    const [, query] = href.split("?");
    const params = new URLSearchParams(query);
    expect(href.startsWith("mailto:hello@example.com?")).toBe(true);
    expect(params.get("subject")).toBe("NOMM: manage my menu (Tea Spot)");
    expect(params.get("body")).toBe("Your name: Sara\nYour role: Manager\nPhone or WhatsApp number: +971500000000\nRestaurant name: Tea Spot");
  });
});

describe("shown and dismissed", () => {
  it("only carry the survey id", () => {
    expect(surveyShownProps("abc")).toEqual({ $survey_id: "abc" });
    expect(surveyDismissedProps("abc")).toEqual({ $survey_id: "abc" });
  });
});

describe("ownerInterestErrors", () => {
  const ok = { name: "Sara", role: "Owner" as const, phone: "+971 50 123 4567", email: "", restaurant: "Tea Spot" };

  it("accepts a complete form with no email", () => {
    expect(ownerInterestErrors(ok)).toEqual({});
  });

  it("flags every missing required field and leaves email alone", () => {
    expect(ownerInterestErrors({ name: " ", role: "", phone: "", email: "", restaurant: "" })).toEqual({
      name: "required",
      role: "chooseRole",
      phone: "required",
      restaurant: "required",
    });
  });

  it("rejects numbers that are too short or contain letters, and malformed emails", () => {
    expect(ownerInterestErrors({ ...ok, phone: "12345" }).phone).toBe("phone");
    expect(ownerInterestErrors({ ...ok, phone: "call me" }).phone).toBe("phone");
    expect(ownerInterestErrors({ ...ok, email: "nope" }).email).toBe("email");
    expect(ownerInterestErrors({ ...ok, email: "a@b.co" }).email).toBeUndefined();
  });
});
