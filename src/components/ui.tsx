"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/format";

export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex h-[26px] w-[44px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200",
        checked ? "justify-end bg-accent" : "justify-start bg-surface-3",
        className,
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", bounce: 0.35, duration: 0.35 }}
        className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)]"
      />
    </button>
  );
}

export function Card({
  className,
  flush,
  children,
}: {
  className?: string;
  /** Skip the default padding when the content manages its own. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return <section className={cn("rounded-[24px] bg-surface ring-1 ring-line", !flush && "p-5", className)}>{children}</section>;
}

export function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "accent" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      className={cn(
        "pressable inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-ink text-bg hover:opacity-90",
        variant === "accent" && "bg-accent text-on-accent hover:opacity-90",
        variant === "secondary" && "bg-surface-2 text-ink hover:bg-surface-3",
        variant === "ghost" && "text-ink-2 hover:bg-surface-2 hover:text-ink",
        className,
      )}
    />
  );
}
