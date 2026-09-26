"use client";

import { cn } from "@/lib/format";

export const inputClass =
  "h-11 w-full rounded-xl bg-surface-2/70 px-3.5 text-[14.5px] text-ink ring-1 ring-transparent outline-none transition-[box-shadow,background-color] placeholder:text-ink-3 focus:bg-surface focus:ring-2 focus:ring-brand aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger";

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3 text-[12.5px] font-medium text-ink-2">
        {label}
        {hint && !error && <span className="font-normal text-ink-3">{hint}</span>}
        {error && <span className="font-medium text-danger">{error}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput({
  invalid,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...props} aria-invalid={invalid || undefined} className={cn(inputClass, className)} />;
}

export function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "h-auto min-h-[76px] resize-y py-2.5 leading-relaxed", className)} />;
}

export function Section({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-[24px] bg-surface p-5 ring-1 ring-line sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-full rounded-xl bg-surface-2/70 p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 flex-1 rounded-lg text-[13.5px] font-semibold transition-[background-color,color,box-shadow]",
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
