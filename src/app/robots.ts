import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

const site = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/ops", "/api/", "/en/dashboard/", "/ar/dashboard/", "/en/claim/", "/ar/claim/"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
