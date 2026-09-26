import type { Metadata } from "next";
import { FindRestaurant } from "@/components/claim/find-restaurant";
import { restaurants } from "@/data/restaurants";

export const metadata: Metadata = { title: "For restaurants" };

export default function ClaimIndex() {
  return <FindRestaurant restaurants={restaurants} />;
}
