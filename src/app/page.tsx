import { DiscoverPage } from "@/components/discover/discover-page";
import { restaurants } from "@/data/restaurants";

export default function Home() {
  return <DiscoverPage restaurants={restaurants} />;
}
