"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Camera, ImagePlus, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type ExtractResult, extractMenu } from "@/app/ops/extract-action";
import { cn } from "@/lib/format";

const MAX_PHOTOS = 8;
const MAX_EDGE = 1600;

/**
 * Shrinks photos in the browser before upload: phone photos are 3–8 MB,
 * serverless request bodies cap out around 4 MB, and 1600px is plenty for
 * reading menu text.
 */
async function downscale(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode failed"))), "image/jpeg", 0.82),
  );
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

const STATUS = ["Reading the menu…", "Finding sections…", "Transcribing prices…", "Checking sizes and add-ons…", "Almost there…"];

type Shot = { id: string; file: File; url: string };

export function PhotoImport({
  onResult,
  hasMenu,
}: {
  onResult: (r: Extract<ExtractResult, { ok: true }>) => void;
  hasMenu: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "reading" | "done">("idle");
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => () => shots.forEach((s) => URL.revokeObjectURL(s.url)), [shots]);
  useEffect(() => {
    if (status !== "reading") return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STATUS.length - 1)), 6000);
    return () => clearInterval(t);
  }, [status]);

  const add = async (files: FileList | File[]) => {
    setError(null);
    const images = [...files].filter((f) => f.type.startsWith("image/")).slice(0, MAX_PHOTOS - shots.length);
    const next = await Promise.all(
      images.map(async (f) => {
        const small = await downscale(f).catch(() => f);
        return { id: crypto.randomUUID(), file: small, url: URL.createObjectURL(small) };
      }),
    );
    setShots((s) => [...s, ...next]);
  };

  const read = async () => {
    if (hasMenu && !confirm("Replace the current menu with what's read from these photos?")) return;
    setStatus("reading");
    setStep(0);
    setError(null);
    setWarnings([]);
    const form = new FormData();
    shots.forEach((s) => form.append("photos", s.file));
    try {
      const res = await extractMenu(form);
      if (!res.ok) {
        setError(res.error);
        setStatus("idle");
        return;
      }
      setWarnings(res.warnings);
      onResult(res);
      setStatus("done");
    } catch {
      setError("The request failed or timed out. Try fewer photos at a time.");
      setStatus("idle");
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-[20px] border-[1.5px] border-dashed p-4 transition-colors",
          dragging ? "border-brand bg-brand-soft" : "border-line-strong",
        )}
      >
        {shots.length === 0 ? (
          <button type="button" onClick={() => input.current?.click()} className="flex w-full flex-col items-center py-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
              <Camera className="size-5" strokeWidth={2} />
            </span>
            <span className="mt-3 text-[14.5px] font-medium">Add menu photos</span>
            <span className="mt-1 text-[12.5px] text-ink-3">Take or drop up to {MAX_PHOTOS} photos. Straight-on and well lit works best.</span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <AnimatePresence initial={false}>
              {shots.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                  <img src={s.url} alt="" className="size-full object-cover" />
                  {status !== "reading" && (
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => setShots((all) => all.filter((x) => x.id !== s.id))}
                      className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur"
                    >
                      <X className="size-3.5" strokeWidth={2.6} />
                    </button>
                  )}
                  {status === "reading" && <div className="skeleton absolute inset-0 opacity-60 mix-blend-overlay" />}
                </motion.div>
              ))}
            </AnimatePresence>
            {shots.length < MAX_PHOTOS && status !== "reading" && (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="grid aspect-[3/4] place-items-center rounded-xl bg-surface-2/70 text-ink-3 transition-colors hover:text-ink"
                aria-label="Add more photos"
              >
                <ImagePlus className="size-5" strokeWidth={2} />
              </button>
            )}
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {shots.length > 0 && (
        <button
          type="button"
          onClick={read}
          disabled={status === "reading"}
          className="pressable mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-[14.5px] font-semibold text-on-brand disabled:opacity-80"
        >
          {status === "reading" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <AnimatePresence mode="wait">
                <motion.span key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  {STATUS[step]}
                </motion.span>
              </AnimatePresence>
            </>
          ) : (
            <>
              <Sparkles className="size-4" strokeWidth={2.2} />
              {status === "done" ? "Read again" : `Read menu from ${shots.length} photo${shots.length > 1 ? "s" : ""}`}
            </>
          )}
        </button>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className="mt-3 overflow-hidden rounded-xl bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger"
          >
            {error}
          </motion.p>
        )}
        {status === "done" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 overflow-hidden rounded-xl bg-brand-soft px-3.5 py-2.5 text-[13px] text-brand"
          >
            Draft filled in below. Check every price against the photos before publishing.
            {warnings.length > 0 && (
              <ul className="mt-2 space-y-1 text-warning">
                {warnings.map((w) => (
                  <li key={w} className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.2} /> {w}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
