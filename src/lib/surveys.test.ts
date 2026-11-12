import { describe, expect, it } from "vitest";
import { en } from "@/i18n/dictionaries/en";
import { ar } from "@/i18n/dictionaries/ar";
import {
  ORDER_FEEDBACK,
  isGoogleMapsLink,
  MENU_FILE_ACCEPT,
  MENU_FILE_LIMITS,
  menuFilePath,
  menuFileType,
  menuSubmissionArgs,
  menuSubmissionErrors,
  menuSubmissionEventProps,
  normalizeOwnerPhone,
  ownerWhatsAppUrl,
  pickMenuFiles,
  submitFailure,
  uploadFailure,
  whatsappDigits,
  OWNER_INTEREST,
  newSubmissionId,
  orderFeedbackAnswers,
  ownerInterestAnswers,
  ownerInterestErrors,
  ownerInterestMailto,
  RESTAURANT_SUGGESTION,
  restaurantSuggestionAnswers,
  restaurantSuggestionErrors,
  restaurantSuggestionMailto,
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

describe("restaurant suggestion", () => {
  const form = { name: " Sushi Haus ", phone: " +971 2 555 0100 ", maps: " https://maps.app.goo.gl/abc123 " };

  it("sends the trimmed name, phone and Google Maps link", () => {
    const p = surveySentProps({
      surveyId: RESTAURANT_SUGGESTION.id,
      submissionId: "sub-1",
      answers: restaurantSuggestionAnswers(form),
      extra: { source: "search" },
    });
    expect(p.$survey_questions.map((q) => q.response)).toEqual(["Sushi Haus", "+971 2 555 0100", "https://maps.app.goo.gl/abc123"]);
    expect(p.source).toBe("search");
  });

  it("requires the name and a phone number", () => {
    expect(restaurantSuggestionErrors({ name: "  ", phone: "", maps: "" })).toEqual({ name: "required", phone: "phoneRequired" });
    expect(restaurantSuggestionErrors(form)).toEqual({});
  });

  it("flags a phone number that is not one", () => {
    expect(restaurantSuggestionErrors({ name: "A", phone: "abc", maps: "" }).phone).toBe("phoneInvalid");
    expect(restaurantSuggestionErrors({ name: "A", phone: "12345", maps: "" }).phone).toBe("phoneInvalid");
  });

  it("makes the Google Maps link optional, but it must be one when given", () => {
    expect(restaurantSuggestionErrors({ name: "A", phone: "025550100", maps: "" })).toEqual({});
    expect(restaurantSuggestionErrors({ name: "A", phone: "025550100", maps: "https://instagram.com/sushihaus" }).maps).toBe("mapsInvalid");
    expect(restaurantSuggestionErrors({ name: "A", phone: "025550100", maps: "sushi haus yas island" }).maps).toBe("mapsInvalid");
  });

  it.each([
    "https://maps.app.goo.gl/abc123",
    "https://goo.gl/maps/abc123",
    "https://www.google.com/maps/place/Sushi+Haus/@24.4,54.3,17z",
    "https://www.google.ae/maps?cid=123456",
    "https://maps.google.com/?q=sushi",
    "google.com/maps/place/Sushi+Haus",
    "https://g.page/sushihaus",
  ])("accepts %s", (link) => {
    expect(isGoogleMapsLink(link)).toBe(true);
  });

  it.each(["https://google.com/search?q=sushi", "https://goo.gl/abc", "https://evilgoogle.com/maps", "", "not a link"])(
    "rejects %s",
    (link) => {
      expect(isGoogleMapsLink(link)).toBe(false);
    },
  );

  it("builds an email fallback with the answers", () => {
    const href = restaurantSuggestionMailto("hello@example.com", form);
    expect(href.startsWith("mailto:hello@example.com?subject=")).toBe(true);
    expect(decodeURIComponent(href)).toContain("Which restaurant are you looking for?: Sushi Haus");
    expect(decodeURIComponent(href)).toContain("Google Maps link: https://maps.app.goo.gl/abc123");
    expect(decodeURIComponent(href)).toContain("Restaurant's WhatsApp number: +971 2 555 0100");
  });
});

describe("menu submission form", () => {
  const ok = { restaurant: "Tea Spot", maps: "https://maps.app.goo.gl/abc123", phone: "050 123 4567", contact: "" };

  it("accepts a complete form with one file and no contact name", () => {
    expect(menuSubmissionErrors(ok, 1)).toEqual({});
  });

  it("requires the restaurant, a Google Maps link, a phone number and a file", () => {
    expect(menuSubmissionErrors({ restaurant: " ", maps: "", phone: "", contact: "" }, 0)).toEqual({
      restaurant: "restaurantRequired",
      maps: "mapsRequired",
      phone: "phoneRequired",
      files: "filesRequired",
    });
  });

  it("uses the Google Maps check on the link", () => {
    expect(menuSubmissionErrors({ ...ok, maps: "https://instagram.com/teaspot" }, 1).maps).toBe("mapsInvalid");
    expect(menuSubmissionErrors({ ...ok, maps: "tea spot khalifa city" }, 1).maps).toBe("mapsInvalid");
    expect(menuSubmissionErrors({ ...ok, maps: "google.com/maps/place/Tea+Spot" }, 1).maps).toBeUndefined();
  });

  it("flags bad numbers but takes Arabic-Indic digits", () => {
    expect(menuSubmissionErrors({ ...ok, phone: "12345" }, 1).phone).toBe("phoneInvalid");
    expect(menuSubmissionErrors({ ...ok, phone: "call me" }, 1).phone).toBe("phoneInvalid");
    expect(menuSubmissionErrors({ ...ok, phone: "٠٥٠١٢٣٤٥٦٧" }, 1).phone).toBeUndefined();
  });

  it("builds RPC arguments: trimmed, link given https://, UAE number normalised, empty name as null", () => {
    const args = menuSubmissionArgs({
      id: "11111111-2222-4333-8444-555555555555",
      values: { restaurant: "  Tea Spot ", maps: " google.com/maps/place/Tea+Spot ", phone: "٠٥٠ ١٢٣ ٤٥٦٧", contact: "  " },
      paths: ["submissions/11111111-2222-4333-8444-555555555555/01.jpg"],
      source: "home",
      locale: "ar",
    });
    expect(args).toEqual({
      p_id: "11111111-2222-4333-8444-555555555555",
      p_restaurant_name: "Tea Spot",
      p_maps_url: "https://google.com/maps/place/Tea+Spot",
      p_phone: "+971501234567",
      p_contact_name: null,
      p_file_paths: ["submissions/11111111-2222-4333-8444-555555555555/01.jpg"],
      p_source: "home",
      p_locale: "ar",
    });
    expect(menuSubmissionArgs({ id: "x", values: { ...ok, contact: " Sara " }, paths: [], source: "home", locale: "en" }).p_maps_url).toBe(
      "https://maps.app.goo.gl/abc123",
    );
  });

  it("keeps the name and number out of the analytics event", () => {
    const props = menuSubmissionEventProps({ source: "search", locale: "en", fileCount: 3 });
    expect(props).toEqual({ source: "search", locale: "en", file_count: 3 });
  });
});

describe("menu files", () => {
  const file = (name: string, type: string, size = 1000) => ({ name, type, size });

  it.each([
    ["menu.jpg", "image/jpeg", "jpg", "image/jpeg"],
    ["menu.JPEG", "", "jpg", "image/jpeg"],
    ["menu.png", "image/png", "png", "image/png"],
    ["menu.webp", "image/webp", "webp", "image/webp"],
    ["IMG_0001.HEIC", "", "heic", "image/heic"],
    ["IMG_0001.heic", "application/octet-stream", "heic", "image/heic"],
    ["photo.heif", "image/heif", "heif", "image/heif"],
    ["menu.pdf", "application/pdf", "pdf", "application/pdf"],
  ])("accepts %s (%s)", (name, type, ext, mime) => {
    expect(menuFileType({ name, type })).toMatchObject({ ext, mime });
  });

  it.each([
    ["menu.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ["menu.gif", "image/gif"],
    ["clip.mov", "video/quicktime"],
    ["notes.pdf", "text/plain"],
    ["noextension", ""],
  ])("rejects %s (%s)", (name, type) => {
    expect(menuFileType({ name, type })).toBeNull();
  });

  it("turns away wrong types, files over 10 MB, and anything past 10 files", () => {
    const { accepted, rejected } = pickMenuFiles(8, [
      file("a.jpg", "image/jpeg"),
      file("menu.docx", "application/msword"),
      file("big.png", "image/png", MENU_FILE_LIMITS.maxBytes + 1),
      file("b.pdf", "application/pdf"),
      file("c.jpg", "image/jpeg"),
    ]);
    expect(accepted.map((f) => f.name)).toEqual(["a.jpg", "b.pdf"]);
    expect(rejected).toEqual([
      { name: "menu.docx", problem: "type" },
      { name: "big.png", problem: "size" },
      { name: "c.jpg", problem: "tooMany" },
    ]);
  });

  it("accepts a file of exactly 10 MB", () => {
    expect(pickMenuFiles(0, [file("a.jpg", "image/jpeg", MENU_FILE_LIMITS.maxBytes)]).accepted).toHaveLength(1);
  });

  it("names stored files by slot, ASCII only, under the submission's folder", () => {
    expect(menuFilePath("abc", 0, "jpg")).toBe("submissions/abc/01.jpg");
    expect(menuFilePath("abc", 9, "pdf")).toBe("submissions/abc/10.pdf");
  });

  it("lets the picker offer HEIC by extension too", () => {
    expect(MENU_FILE_ACCEPT).toContain("image/heic");
    expect(MENU_FILE_ACCEPT).toContain(".heic");
    expect(MENU_FILE_ACCEPT).toContain("application/pdf");
  });
});

describe("menu upload failures", () => {
  it("sends the owner to WhatsApp when the bucket or permission is missing", () => {
    expect(uploadFailure(400, '{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}')).toBe("unavailable");
    expect(uploadFailure(403, '{"message":"new row violates row-level security policy"}')).toBe("unavailable");
    expect(uploadFailure(404, "")).toBe("unavailable");
  });

  it("treats an already uploaded file as done, and tells size, type and network apart", () => {
    expect(uploadFailure(409, '{"error":"Duplicate","message":"The resource already exists"}')).toBe("exists");
    expect(uploadFailure(413, "")).toBe("tooLarge");
    expect(uploadFailure(400, '{"message":"mime type image/gif is not supported"}')).toBe("type");
    expect(uploadFailure(0, "")).toBe("network");
    expect(uploadFailure(500, "boom")).toBe("other");
  });

  it("knows when submit_menu doesn't exist yet", () => {
    expect(submitFailure({ code: "PGRST202", message: "Could not find the function mealtree.submit_menu" })).toBe("unavailable");
    expect(submitFailure({ code: "22023", message: "invalid_input" })).toBe("invalid");
    expect(submitFailure({ code: "P0002", message: "files_missing" })).toBe("retry");
    expect(submitFailure(null)).toBe("retry");
  });
});

describe("owner WhatsApp", () => {
  it("links to NOMM's number with the drafted message, naming the restaurant when typed", () => {
    const url = ownerWhatsAppUrl(en.menuForm.whatsappMessage("Tea Spot"));
    expect(url.startsWith("https://wa.me/971554304391?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("Tea Spot");
    expect(decodeURIComponent(ownerWhatsAppUrl(ar.menuForm.whatsappMessage("")))).toContain("لمطعمي");
  });

  it("normalises owners' numbers for wa.me", () => {
    expect(normalizeOwnerPhone("050 123 4567")).toBe("+971501234567");
    expect(whatsappDigits("050 123 4567")).toBe("971501234567");
    expect(whatsappDigits("+971 55 430 4391")).toBe("971554304391");
    expect(whatsappDigits("0044 20 7946 0958")).toBe("442079460958");
    expect(whatsappDigits("123")).toBeNull();
  });
});

describe("menuSubmissionAnswers", () => {
  it("mirrors the saved row and points to /ops for the files", async () => {
    const { menuSubmissionAnswers, menuSubmissionArgs, surveySentProps, MENU_SUBMISSION } = await import("./surveys");
    const args = menuSubmissionArgs({
      id: "11111111-2222-4333-8444-555555555555",
      values: { restaurant: " Cafe X ", maps: "maps.app.goo.gl/abc", phone: "050 123 4567", contact: "" },
      paths: ["submissions/11111111-2222-4333-8444-555555555555/01.jpg", "submissions/11111111-2222-4333-8444-555555555555/02.pdf"],
      source: "home",
      locale: "en",
    });
    const props = surveySentProps({ surveyId: MENU_SUBMISSION.id, submissionId: args.p_id, answers: menuSubmissionAnswers(args) });
    expect(props.$survey_id).toBe(MENU_SUBMISSION.id);
    expect(props[`$survey_response_${MENU_SUBMISSION.restaurant.id}`]).toBe("Cafe X");
    expect(props[`$survey_response_${MENU_SUBMISSION.maps.id}`]).toBe("https://maps.app.goo.gl/abc");
    expect(props[`$survey_response_${MENU_SUBMISSION.phone.id}`]).toBe(args.p_phone);
    expect(props[`$survey_response_${MENU_SUBMISSION.files.id}`]).toBe("2 files - open in /ops > Menu submissions");
  });
});
