import { describe, expect, it } from "vitest";
import { siteUrl } from "./seo";

describe("siteUrl", () => {
  it("prefers NEXT_PUBLIC_SITE_URL and strips trailing slashes", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://nomm.ae///", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://nomm.ae");
  });

  it("falls back to the Vercel production domain over https", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "nomm.vercel.app" })).toBe("https://nomm.vercel.app");
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "https://nomm.vercel.app/" })).toBe("https://nomm.vercel.app");
  });

  it("falls back to localhost, treating empty values as unset", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: " ", VERCEL_PROJECT_PRODUCTION_URL: "" })).toBe("http://localhost:3000");
  });
});
