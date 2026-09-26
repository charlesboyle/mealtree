import type { Metadata } from "next";
import { OpsBoard } from "@/components/ops/ops-board";
import { restaurants } from "@/data/restaurants";

export const metadata: Metadata = { title: "Ops", robots: { index: false } };

export default function OpsPage() {
  return <OpsBoard restaurants={restaurants} />;
}
