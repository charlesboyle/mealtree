import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale } from "./config";
import { makeI18n } from "./index";

/** i18n for the current request's locale (the `[lang]` root segment). */
export async function getI18n() {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return makeI18n(locale);
}
