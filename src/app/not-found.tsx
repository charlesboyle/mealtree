import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="animate-rise">
        <LogoMark className="mx-auto size-10" />
        <h1 className="mt-6 font-display text-4xl tracking-tight">This menu isn&apos;t here</h1>
        <p className="mt-2 text-[15px] text-ink-2">It may have moved, or we haven&apos;t added it yet.</p>
        <Link
          href="/"
          className="pressable mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[14px] font-medium text-bg"
        >
          Browse restaurants
        </Link>
      </div>
    </main>
  );
}
