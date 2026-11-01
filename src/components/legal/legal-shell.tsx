"use client";

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
    <>
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:px-6">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-plum sm:text-3xl">
          {title}
        </h1>
        {lead && <p className="mt-3 text-base text-muted">{lead}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-base text-ink-2 [&_a]:font-medium [&_a]:text-brand [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:ps-5">
      {children}
    </div>
  );
}
