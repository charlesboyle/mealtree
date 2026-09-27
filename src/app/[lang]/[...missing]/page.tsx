import { notFound } from "next/navigation";

/** Unknown paths under /en or /ar get the localized 404. */
export default function Missing() {
  notFound();
}
