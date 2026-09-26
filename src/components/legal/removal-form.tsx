"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Field, TextArea, TextInput, inputClass } from "@/components/ops/editor/fields";
import { LegalShell } from "./legal-shell";
import { getBrowserClient } from "@/lib/supabase/client";

type Option = { slug: string; name: string; address: string };

export function RemovalForm({ restaurants, initialSlug }: { restaurants: Option[]; initialSlug: string }) {
  const [slug, setSlug] = useState(restaurants.some((r) => r.slug === initialSlug) ? initialSlug : "");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const valid = slug && name.trim() && contact.trim().length >= 3;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const db = getBrowserClient();
    if (!db) {
      setError("Requests can't be sent from this demo. Email us instead.");
      return;
    }
    setStatus("sending");
    setError(null);
    const { error } = await db.rpc("request_removal", { p_slug: slug, p_name: name, p_contact: contact, p_reason: reason });
    if (error) {
      setStatus("idle");
      setError("Couldn't send that. Check your connection and try again.");
      return;
    }
    setStatus("sent");
  };

  return (
    <LegalShell title="Take down a page" lead="If you own or manage a restaurant listed here and want its page removed, tell us below. We hide the page, usually within one business day, and won't list it again.">
      <AnimatePresence mode="wait">
        {status === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[24px] bg-surface p-6 text-center ring-1 ring-line"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-positive text-white">
              <Check className="size-6" strokeWidth={2.6} />
            </span>
            <p className="mt-4 text-[16px] font-semibold">Request received</p>
            <p className="mt-1 text-[14px] text-ink-2">We&apos;ll confirm with you at {contact} once the page is down.</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} className="space-y-4 rounded-[24px] bg-surface p-5 ring-1 ring-line sm:p-6">
            <Field label="Restaurant">
              <select value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} required>
                <option value="" disabled>
                  Choose your restaurant
                </option>
                {restaurants.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.name} — {r.address}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Your name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </Field>
            <Field label="Email or phone" hint="so we can confirm">
              <TextInput value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" required />
            </Field>
            <Field label="Anything else?" hint="optional">
              <TextArea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={2000} />
            </Field>
            {error && (
              <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
                {error}
              </p>
            )}
            <button
              disabled={!valid || status === "sending"}
              className="pressable flex h-12 w-full items-center justify-center rounded-full bg-ink text-[15px] font-semibold text-bg disabled:opacity-40"
            >
              {status === "sending" ? <Loader2 className="size-5 animate-spin" /> : "Request takedown"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </LegalShell>
  );
}
