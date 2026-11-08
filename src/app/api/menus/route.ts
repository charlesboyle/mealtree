import type { NextRequest } from "next/server";
import { findRestaurant } from "@/lib/data";

/**
 * Full menus for a few restaurants (`?slug=a&slug=b`). List pages ship trimmed
 * menus, so the saved page asks for these only for restaurants with a bag.
 */
export async function GET(request: NextRequest) {
  const slugs = [...new Set(request.nextUrl.searchParams.getAll("slug"))].slice(0, 20);
  const found = await Promise.all(slugs.map((slug) => findRestaurant(slug)));
  const menus = found.flatMap((r) => (r ? [{ slug: r.slug, menus: r.menus }] : []));
  return Response.json(menus, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
