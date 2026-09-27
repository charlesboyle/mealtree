"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Field, TextArea, TextInput, inputClass } from "@/components/ops/editor/fields";
import { useI18n } from "@/i18n/client";
import { getBrowserClient } from "@/lib/supabase/client";
import { LegalShell } from "./legal-shell";

type Option = { slug: string; name: string; nameAr?: string; address: string; addressAr?: string };

export function RemovalForm({ restaurants, initialSlug }: { restaurants: Option[]; initialSlug: string }) {
  const { t, pick } = useI18n();
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
      setError(t.removal.demo);
      return;
    }
    setStatus("sending");
    setError(null);
    const { error } = await db.rpc("request_removal", { p_slug: slug, p_name: name, p_contact: contact, p_reason: reason });
    if (error) {
      setStatus("idle");
      setError(t.removal.failed);
      return;
    }
    setStatus("sent");
  };

  return (
    <LegalShell title={t.removal.title} lead={t.removal.lead}>
      <AnimatePresence mode="wait">
        {status === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-line p-6 text-center"
          >
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-positive text-white">
              <Check className="size-6" strokeWidth={2.6} />
            </span>
            <p className="mt-4 text-md font-semibold">{t.removal.received}</p>
            <p className="mt-1 text-sm text-ink-2">{t.removal.receivedBody(contact)}</p>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} className="space-y-4">
            <Field label={t.removal.restaurant}>
              <select value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} required>
                <option value="" disabled>
                  {t.removal.choose}
                </option>
                {restaurants.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {pick(r.name, r.nameAr)} — {pick(r.address, r.addressAr)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.removal.yourName}>
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </Field>
            <Field label={t.removal.contact} hint={t.removal.contactHint}>
              <TextInput value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" dir="auto" required />
            </Field>
            <Field label={t.removal.notes} hint={t.removal.optional}>
              <TextArea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={2000} />
            </Field>
            {error && (
              <p role="alert" className="rounded-lg bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}
            <button
              disabled={!valid || status === "sending"}
              className="pressable flex h-12 w-full items-center justify-center rounded-xl bg-ink text-base font-semibold text-bg disabled:opacity-40"
            >
              {status === "sending" ? <Loader2 className="size-5 animate-spin" /> : t.removal.submit}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </LegalShell>
  );
}
