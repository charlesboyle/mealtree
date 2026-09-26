import { DiscoverPage } from "@/components/discover/discover-page";
import { listRestaurants } from "@/lib/data";

// Refresh restaurant data from Supabase every 5 minutes (matches REVALIDATE_SECONDS).
export const revalidate = 300;

export default async function Home() {
  return <DiscoverPage restaurants={await listRestaurants()} />;
}
