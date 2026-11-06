import Link from "next/link";
import { cn } from "@/lib/format";

export function buttonStyles(variant: "primary" | "secondary" = "primary", className?: string) {
  return cn(
    "inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98]",
    variant === "primary" && "bg-tomato text-white hover:bg-tomato-dark",
    variant === "secondary" && "bg-paper text-plum hover:bg-soft",
    className,
  );
}

/** Tomato pill link for calls to action that navigate. */
export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={buttonStyles(variant, className)}
    >
      {children}
    </Link>
  );
}
