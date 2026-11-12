"use client";

import { AlertTriangle, Check, ChevronRight, FileText, ImageIcon, Loader2, MessageCircleMore, Plus, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CheckMark } from "@/components/check-mark";
import { Sheet } from "@/components/sheet";
import { Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import { submitMenu, uploadMenuFile } from "@/lib/menu-upload";
import {
  MENU_FILE_ACCEPT,
  MENU_FILE_LIMITS,
  menuFilePath,
  menuFileType,
  type MenuFileProblem,
  type MenuFormError,
  type MenuFormField,
  type MenuSubmissionSource,
  menuSubmissionArgs,
  menuSubmissionErrors,
  menuSubmissionEventProps,
  newSubmissionId,
  OWNER_WHATSAPP_DISPLAY,
  ownerWhatsAppUrl,
  pickMenuFiles,
} from "@/lib/surveys";
import { trackMenuSubmission } from "@/lib/track";

const FIELD =
  "mt-1.5 w-full rounded-xl bg-plum/[0.05] px-4 text-md text-plum outline-none transition-colors duration-150 placeholder:text-muted focus:bg-plum/[0.08] aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger";
const FIELD_ORDER: MenuFormField[] = ["restaurant", "maps", "phone", "files"];
const PARALLEL_UPLOADS = 2;

export const OPEN_MENU_FORM_EVENT = "nomm:open-menu-form";
type OpenDetail = { source: MenuSubmissionSource; restaurant?: string; maps?: string };

/** Opens the "Get your digital menu for free" form from anywhere on the public site (it is mounted once, in SiteShell). */
export function openMenuForm(detail: OpenDetail) {
  window.dispatchEvent(new CustomEvent<OpenDetail>(OPEN_MENU_FORM_EVENT, { detail }));
}

/** A button that opens the owner menu form. */
export function MenuFormButton({
  source,
  restaurant,
  className,
  children,
  onBeforeOpen,
}: {
  source: MenuSubmissionSource;
  /** Prefills the restaurant name (what the diner searched for). */
  restaurant?: string;
  className?: string;
  children: React.ReactNode;
  /** e.g. close the search sheet first, so only one dialog is up. */
  onBeforeOpen?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onBeforeOpen?.();
        openMenuForm({ source, restaurant: restaurant?.trim() || undefined });
      }}
      className={className}
    >
      {children}
    </button>
  );
}

/** Listens for openMenuForm() and shows the sheet. Each opening starts a fresh form. */
export function MenuSubmissionHost() {
  const [state, setState] = useState<{ open: boolean } & OpenDetail>({ open: false, source: "home" });
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  useEffect(() => {
    const onOpen = (e: Event) => setState({ open: true, ...(e as CustomEvent<OpenDetail>).detail });
    window.addEventListener(OPEN_MENU_FORM_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MENU_FORM_EVENT, onOpen);
  }, []);

  return <MenuSubmissionForm open={state.open} onClose={close} source={state.source} initial={state} />;
}

export function MenuSubmissionForm({
  open,
  onClose,
  source,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  source: MenuSubmissionSource;
  initial?: { restaurant?: string; maps?: string };
}) {
  const { t } = useI18n();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={t.menuForm.title}
      look="modal"
      className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl bg-white pb-[max(16px,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
    >
      <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <Body source={source} initial={initial} onClose={onClose} />
    </Sheet>
  );
}

type Item = {
  key: string;
  file: File;
  ext: string;
  mime: string;
  kind: "image" | "pdf";
  preview: string | null;
  state: "idle" | "uploading" | "done" | "error";
  progress: number;
  path?: string;
};
type Failure = "unavailable" | "retry" | "invalid";

function Body({
  source,
  initial,
  onClose,
}: {
  source: MenuSubmissionSource;
  initial?: { restaurant?: string; maps?: string };
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const f = t.menuForm;
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState({ restaurant: initial?.restaurant ?? "", maps: initial?.maps ?? "", phone: "", contact: "" });
  const [errors, setErrors] = useState<Partial<Record<MenuFormField, MenuFormError>>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [rejected, setRejected] = useState<{ name: string; problem: MenuFileProblem }[]>([]);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving" | "done">("idle");
  const [failure, setFailure] = useState<Failure | null>(null);
  const [dragging, setDragging] = useState(false);

  // The upload folder (= submission id) and the file slots already used in it. Anon can't overwrite, so a slot
  // that was uploaded once stays taken even if the owner removes that file.
  const session = useRef<{ id: string; used: Set<number> } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Closing the sheet stops uploads and frees the previews.
  useEffect(
    () => () => {
      abort.current?.abort();
      for (const it of itemsRef.current) if (it.preview) URL.revokeObjectURL(it.preview);
    },
    [],
  );

  const busy = phase === "uploading" || phase === "saving";
  const waUrl = ownerWhatsAppUrl(f.whatsappMessage(values.restaurant.trim()));

  const set = <K extends keyof typeof values>(key: K, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const addFiles = (list: FileList | File[] | null) => {
    if (!list || busy) return;
    const { accepted, rejected: turnedAway } = pickMenuFiles(itemsRef.current.length, [...list]);
    setRejected(turnedAway);
    if (!accepted.length) return;
    const added: Item[] = accepted.map((file) => {
      const type = menuFileType(file)!;
      return {
        key: newSubmissionId(),
        file,
        ext: type.ext,
        mime: type.mime,
        kind: type.kind,
        preview: type.kind === "image" ? URL.createObjectURL(file) : null,
        state: "idle",
        progress: 0,
      };
    });
    setItems((prev) => [...prev, ...added]);
    setErrors((e) => ({ ...e, files: undefined }));
  };

  const removeItem = (key: string) => {
    setItems((prev) => {
      const gone = prev.find((it) => it.key === key);
      if (gone?.preview) URL.revokeObjectURL(gone.preview);
      return prev.filter((it) => it.key !== key);
    });
    setRejected([]);
  };

  const patch = (key: string, change: Partial<Item>) => setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...change } : it)));

  /** Gives every file without one a free slot in this submission's folder, starting over in a new folder if they run out. */
  const assignPaths = (list: Item[]) => {
    const fresh = () => ({ id: newSubmissionId(), used: new Set<number>() });
    session.current ??= fresh();
    const taken = new Set([...session.current.used, ...list.flatMap((it) => (it.path ? [slotOf(it.path)] : []))]);
    const needed = list.filter((it) => !it.path).length;
    const free = Array.from({ length: MENU_FILE_LIMITS.maxFiles }, (_, i) => i).filter((i) => !taken.has(i));
    if (free.length < needed) {
      session.current = fresh();
      list = list.map((it) => ({ ...it, path: undefined, state: "idle", progress: 0 }));
      return assignPaths(list);
    }
    const s = session.current;
    let next = 0;
    return list.map((it) => (it.path ? it : { ...it, path: menuFilePath(s.id, free[next++], it.ext) }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = menuSubmissionErrors(values, items.length);
    setErrors(found);
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) return formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();

    setFailure(null);
    setPhase("uploading");
    const list = assignPaths(items);
    setItems(list);
    const controller = new AbortController();
    abort.current = controller;

    // Upload whatever isn't up yet, two at a time.
    const queue = list.filter((it) => it.state !== "done");
    const outcomes: ("ok" | "unavailable" | "other")[] = [];
    const worker = async () => {
      for (let it = queue.shift(); it; it = queue.shift()) {
        const item = it;
        patch(item.key, { state: "uploading", progress: 0 });
        const res = await uploadMenuFile({
          path: item.path!,
          file: item.file,
          contentType: item.mime,
          signal: controller.signal,
          onProgress: (p) => patch(item.key, { progress: p }),
        });
        if (res.ok) {
          session.current?.used.add(slotOf(item.path!));
          patch(item.key, { state: "done", progress: 1 });
          outcomes.push("ok");
        } else {
          if (res.failure === "aborted") return;
          patch(item.key, { state: "error", progress: 0 });
          outcomes.push(res.failure === "unavailable" ? "unavailable" : "other");
        }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL_UPLOADS }, worker));
    if (controller.signal.aborted) return;
    if (outcomes.some((o) => o !== "ok")) {
      setFailure(outcomes.includes("unavailable") ? "unavailable" : "retry");
      setPhase("idle");
      return;
    }

    setPhase("saving");
    const res = await submitMenu(
      menuSubmissionArgs({ id: session.current!.id, values, paths: list.map((it) => it.path!), source, locale }),
    );
    if (controller.signal.aborted) return;
    if (!res.ok) {
      setFailure(res.failure);
      setPhase("idle");
      return;
    }
    trackMenuSubmission(menuSubmissionEventProps({ source, locale, fileCount: list.length }));
    setPhase("done");
  };

  const header = (
    <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{f.title}</h2>
        <p className="text-sm text-muted">{f.lead}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.common.close}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft text-ink transition-colors duration-150 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <X className="size-4" />
      </button>
    </div>
  );

  if (phase === "done") {
    return (
      <div>
        {header}
        <div className="flex flex-col items-center px-6 pb-4 pt-6 text-center" role="status">
          <CheckMark />
          <h3 className="mt-4 text-lg font-semibold text-ink">{f.doneTitle}</h3>
          <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-muted">{f.done}</p>
          <div className="mt-5 w-full rounded-2xl bg-paper p-4 text-start">
            <p className="text-[13px] font-semibold text-plum">{f.nextTitle}</p>
            <ol className="mt-2 space-y-2">
              {f.next.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5 text-sm text-plum">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold text-tomato shadow-card">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <Button variant="primary" onClick={onClose} className="mt-6 w-full">
            {f.doneButton}
          </Button>
        </div>
      </div>
    );
  }

  const errorText = (field: MenuFormField) => (errors[field] ? f.errors[errors[field]!] : undefined);
  const field = (key: MenuFormField, hint?: boolean) => ({
    id: `${uid}-${key}`,
    "data-field": key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": [hint && `${uid}-${key}-hint`, errors[key] && `${uid}-${key}-error`].filter(Boolean).join(" ") || undefined,
  });
  const uploaded = items.filter((it) => it.state === "done").length;
  const full = items.length >= MENU_FILE_LIMITS.maxFiles;

  return (
    <div>
      {header}

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group mx-5 mt-2 flex items-center gap-3 rounded-2xl bg-whatsapp/[0.08] p-3.5 transition-colors duration-150 hover:bg-whatsapp/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-whatsapp text-white" aria-hidden>
          <MessageCircleMore className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-plum">{f.whatsappTitle}</span>
          <span className="block text-sm text-muted">
            {f.whatsappBody} <span className="ltr-isolate font-medium text-whatsapp-dark">{OWNER_WHATSAPP_DISPLAY}</span>
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-whatsapp-dark transition-transform duration-150 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" aria-hidden />
      </a>

      <div className="mx-5 mt-4 flex items-center gap-3 text-xs font-medium text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        {f.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form ref={formRef} onSubmit={submit} noValidate className="space-y-4 px-5 pb-2 pt-3">
        <Field id={`${uid}-restaurant`} label={f.restaurant} error={errorText("restaurant")}>
          <input
            {...field("restaurant")}
            value={values.restaurant}
            onChange={(e) => set("restaurant", e.target.value)}
            readOnly={busy}
            maxLength={160}
            autoComplete="organization"
            enterKeyHint="next"
            className={cn(FIELD, "h-12")}
          />
        </Field>

        <Field id={`${uid}-maps`} label={f.maps} hint={f.mapsHint} error={errorText("maps")}>
          <input
            {...field("maps", true)}
            type="url"
            inputMode="url"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={500}
            value={values.maps}
            onChange={(e) => set("maps", e.target.value)}
            readOnly={busy}
            placeholder={f.mapsPlaceholder}
            enterKeyHint="next"
            className={cn(FIELD, "h-12 rtl:text-right")}
          />
        </Field>

        <Field id={`${uid}-phone`} label={f.phone} hint={f.phoneHint} error={errorText("phone")}>
          <input
            {...field("phone", true)}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="tel"
            maxLength={40}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            readOnly={busy}
            placeholder={f.phonePlaceholder}
            enterKeyHint="next"
            className={cn(FIELD, "h-12 rtl:text-right")}
          />
        </Field>

        <Field id={`${uid}-contact`} label={f.contact} optional={f.optional}>
          <input
            id={`${uid}-contact`}
            value={values.contact}
            onChange={(e) => set("contact", e.target.value)}
            readOnly={busy}
            maxLength={120}
            autoComplete="name"
            enterKeyHint="done"
            className={cn(FIELD, "h-12")}
          />
        </Field>

        <div
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <div className="flex items-baseline justify-between gap-3">
            <span id={`${uid}-files-label`} className="text-[13px] font-medium text-plum">
              {f.files}
            </span>
            {items.length > 0 && <span className="text-xs tabular-nums text-muted">{f.fileCount(items.length)}</span>}
          </div>
          <input
            ref={fileInput}
            {...field("files", true)}
            type="file"
            multiple
            accept={MENU_FILE_ACCEPT}
            disabled={busy || full}
            aria-labelledby={`${uid}-files-label`}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = ""; // so the same file can be picked again after removing it
            }}
            className="peer sr-only"
          />
          {items.length === 0 ? (
            <label
              htmlFor={`${uid}-files`}
              className={cn(
                "mt-1.5 flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed text-plum transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-ink",
                errors.files ? "border-danger bg-danger/[0.03]" : dragging ? "border-plum bg-plum/[0.06]" : "border-plum/25 bg-plum/[0.03] hover:bg-plum/[0.05]",
              )}
            >
              <span className="grid size-9 place-items-center rounded-full bg-white shadow-card" aria-hidden>
                <Plus className="size-4" strokeWidth={2.4} />
              </span>
              <span className="text-sm font-semibold">{f.addFiles}</span>
            </label>
          ) : (
            <ul className={cn("mt-1.5 grid grid-cols-4 gap-2 rounded-xl", dragging && "ring-2 ring-plum/40")}>
              {items.map((it) => (
                <FileTile key={it.key} item={it} busy={busy} onRemove={() => removeItem(it.key)} removeLabel={f.remove(it.file.name)} doneLabel={f.fileDone} failedLabel={f.fileFailed} />
              ))}
              {!full && (
                <li>
                  <label
                    htmlFor={`${uid}-files`}
                    className={cn(
                      "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-plum/25 bg-plum/[0.03] p-1 text-center text-plum transition-colors duration-150 hover:bg-plum/[0.05] peer-focus-visible:ring-2 peer-focus-visible:ring-ink",
                      busy && "pointer-events-none opacity-40",
                    )}
                  >
                    <Plus className="size-4" strokeWidth={2.4} aria-hidden />
                    <span className="text-[11px] font-semibold leading-tight">{f.addMore}</span>
                  </label>
                </li>
              )}
            </ul>
          )}
          <p id={`${uid}-files-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
            {f.filesHint}
          </p>
          <div aria-live="polite">
            {rejected.map((r) => (
              <p key={r.name + r.problem} className="mt-1 text-[13px] font-medium text-danger">
                {f.rejected[r.problem](r.name)}
              </p>
            ))}
          </div>
          {errors.files && <ErrorText id={`${uid}-files-error`}>{errorText("files")}</ErrorText>}
        </div>

        {failure && (
          <div role="alert" className="rounded-2xl bg-danger/[0.06] p-4">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />
              {f.failTitle}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">
              {failure === "unavailable" ? f.failUnavailable : failure === "invalid" ? f.failInvalid : f.failRetry}
            </p>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-semibold text-white hover:opacity-90"
            >
              <MessageCircleMore className="size-4" aria-hidden />
              {f.sendOnWhatsApp}
            </a>
          </div>
        )}

        <Button type="submit" variant="primary" aria-busy={busy || undefined} className={cn("w-full", busy && "cursor-progress")}>
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          <span aria-live="polite">
            {phase === "uploading" ? f.uploading(Math.min(uploaded + 1, items.length), items.length) : phase === "saving" ? f.saving : failure ? f.retry : f.submit}
          </span>
        </Button>
        <p className="pb-2 text-center text-xs leading-relaxed text-muted">{f.privacy}</p>
      </form>
    </div>
  );
}

/** Slot (0-based) from a path like submissions/<id>/03.jpg. */
function slotOf(path: string) {
  return Number(path.split("/").pop()!.slice(0, 2)) - 1;
}

function FileTile({
  item,
  busy,
  onRemove,
  removeLabel,
  doneLabel,
  failedLabel,
}: {
  item: Item;
  busy: boolean;
  onRemove: () => void;
  removeLabel: string;
  doneLabel: string;
  failedLabel: string;
}) {
  const [broken, setBroken] = useState(false);
  const Icon = item.kind === "pdf" ? FileText : ImageIcon;
  return (
    <li className={cn("relative aspect-square overflow-hidden rounded-xl bg-plum/[0.05]", item.state === "error" && "ring-2 ring-danger")}>
      {item.preview && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.preview} alt="" onError={() => setBroken(true)} className="size-full object-cover" />
      ) : (
        <span className="flex size-full flex-col items-center justify-center gap-1 px-1.5 text-plum">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
          <span className="w-full truncate text-center text-[10px] font-medium uppercase text-muted">{item.ext}</span>
        </span>
      )}
      <span className="sr-only">{item.file.name}</span>
      {item.state === "uploading" && (
        <span className="absolute inset-x-1.5 bottom-1.5 h-1 overflow-hidden rounded-full bg-white/70" aria-hidden>
          <span className="block h-full rounded-full bg-plum transition-[width] duration-150" style={{ width: `${Math.round(item.progress * 100)}%` }} />
        </span>
      )}
      {item.state === "done" && (
        <span className="absolute bottom-1.5 start-1.5 grid size-5 place-items-center rounded-full bg-fresh text-white" title={doneLabel}>
          <Check className="size-3" strokeWidth={3} aria-hidden />
          <span className="sr-only">{doneLabel}</span>
        </span>
      )}
      {item.state === "error" && (
        <span className="absolute bottom-1.5 start-1.5 grid size-5 place-items-center rounded-full bg-danger text-white" title={failedLabel}>
          <AlertTriangle className="size-3" strokeWidth={2.6} aria-hidden />
          <span className="sr-only">{failedLabel}</span>
        </span>
      )}
      {!busy && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="absolute end-0 top-0 grid size-9 place-items-center focus-visible:outline-none [&:focus-visible>span]:ring-2 [&:focus-visible>span]:ring-ink"
        >
          <span className="grid size-6 place-items-center rounded-full bg-ink/70 text-white">
            <X className="size-3.5" strokeWidth={2.6} aria-hidden />
          </span>
        </button>
      )}
    </li>
  );
}

function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[13px] font-medium text-plum">
        {label}
        {optional && <span className="ms-1.5 font-normal text-muted">({optional})</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-[13px] font-medium text-danger">
      {children}
    </p>
  );
}

