import type { Locale } from "../config";
import { ar } from "./ar";
import { en, type Dictionary } from "./en";

// Both are small, so they ship statically; client components switch without a fetch.
export const dictionaries: Record<Locale, Dictionary> = { en, ar };
export type { Dictionary };
