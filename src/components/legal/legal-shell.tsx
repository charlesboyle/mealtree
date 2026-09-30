"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { Logo } from "@/components/logo";
import { PageTransition } from "@/components/page-transition";
import { useI18n } from "@/i18n/client";

export function LegalShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <PageTransition>
      <div className="min-h-dvh">
        <header className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-5">
          <Logo />
          <LanguageToggle className="-me-2" />
        </header>
        <main className="mx-auto max-w-2xl px-4 pb-20 sm:px-5">
          <h1 className="mt-6 text-3xl font-bold tracking-tight">{title}</h1>
          {lead && <p className="mt-3 text-md text-ink-2">{lead}</p>}
          <div className="mt-8">{children}</div>
        </main>
        <LegalFooter />
      </div>
    </PageTransition>
  );
}

export function LegalFooter() {
  const { t, href } = useI18n();
  return (
    <footer className="border-t border-line">
      <nav className="mx-auto flex max-w-2xl flex-wrap gap-x-5 gap-y-2 px-4 py-6 text-sm text-ink-3 sm:px-5">
        <Link href={href("/terms")} className="hover:text-ink">
          {t.common.terms}
        </Link>
        <Link href={href("/privacy")} className="hover:text-ink">
          {t.common.privacy}
        </Link>
        <Link href={href("/remove")} className="hover:text-ink">
          {t.common.removePage}
        </Link>
        <Link href={href("/claim")} className="hover:text-ink">
          {t.common.forRestaurants}
        </Link>
      </nav>
    </footer>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-base text-ink-2 [&_a]:font-medium [&_a]:text-brand [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5">
      {children}
    </div>
  );
}
