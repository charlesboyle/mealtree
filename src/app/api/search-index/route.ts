import { listRestaurants } from "@/lib/data";
import { buildSearchIndex } from "@/lib/search-index";

// Rebuilt at most hourly (matches REVALIDATE_SECONDS); admin edits refresh it through the "mealtree" tag.
export const revalidate = 3600;

/** Slim restaurant + dish index for dish search (phone search sheet, /restaurants), fetched on first search. */
export async function GET() {
  const index = buildSearchIndex(await listRestaurants());
  return Response.json(index, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } });
}
