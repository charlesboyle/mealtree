import { listRestaurants } from "@/lib/data";
import { buildSearchIndex } from "@/lib/search-index";

/** Slim restaurant + dish index for the phone search sheet, fetched when it first opens. */
export async function GET() {
  const index = buildSearchIndex(await listRestaurants());
  return Response.json(index, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
