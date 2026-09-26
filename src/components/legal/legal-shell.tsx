import Link from "next/link";
import { Logo } from "@/components/logo";

export function LegalShell({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-2xl items-center px-5">
        <Logo />
      </header>
      <main className="mx-auto max-w-2xl px-5 pb-20">
        <h1 className="mt-6 animate-rise font-display text-[38px] leading-[1.05] tracking-[-0.02em] [font-variation-settings:'opsz'_60]">
          {title}
        </h1>
        {lead && <p className="mt-3 animate-rise text-[15.5px] leading-relaxed text-ink-2 [animation-delay:40ms]">{lead}</p>}
        <div className="mt-8 animate-rise [animation-delay:80ms]">{children}</div>
      </main>
      <LegalFooter />
    </div>
  );
}

export function LegalFooter() {
  return (
    <footer className="border-t border-line">
      <nav className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-2 px-5 py-6 text-[13px] text-ink-3">
        <Link href="/terms" className="hover:text-ink">Terms</Link>
        <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        <Link href="/remove" className="hover:text-ink">Remove a page</Link>
        <Link href="/claim" className="hover:text-ink">For restaurants</Link>
      </nav>
    </footer>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-8 [&_h2]:text-[17px] [&_h2]:font-semibold [&_h2]:text-ink [&_a]:font-medium [&_a]:text-brand [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
      {children}
    </div>
  );
}
