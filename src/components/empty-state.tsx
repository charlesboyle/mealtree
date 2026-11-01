import type { LucideIcon } from "lucide-react";

/** Empty and not-found states: a line icon, one short line, an optional action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  children,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center rounded-3xl bg-paper text-center ${compact ? "px-5 py-7" : "px-6 py-12"}`}>
      <Icon className={`text-muted ${compact ? "h-7 w-7" : "h-9 w-9"}`} strokeWidth={1.5} aria-hidden />
      <p className={`mt-3 font-bold tracking-[-0.01em] text-plum ${compact ? "text-base" : "text-lg"}`}>{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
