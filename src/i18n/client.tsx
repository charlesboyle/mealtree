"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./config";
import { makeI18n } from "./index";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  return useMemo(() => makeI18n(locale), [locale]);
}
