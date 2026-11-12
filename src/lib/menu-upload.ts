"use client";

/**
 * Browser side of an owner's menu submission: each file goes straight to the private `owner-menus` bucket with
 * the publishable key (anon may only insert, under submissions/<id>/), then `submit_menu` records the row.
 * XHR rather than supabase-js for the uploads, because only XHR reports upload progress.
 */
import { MENU_BUCKET } from "@/lib/menu-bucket";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase/client";
import { submitFailure, type UploadFailure, uploadFailure } from "@/lib/surveys";

/** Uploads one file. Resolves with the outcome (never rejects); `exists` means an earlier try already got it there. */
export function uploadMenuFile({
  path,
  file,
  contentType,
  onProgress,
  signal,
}: {
  path: string;
  file: Blob;
  contentType: string;
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}): Promise<{ ok: true } | { ok: false; failure: UploadFailure | "aborted" }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseConfigured || !url || !key) return Promise.resolve({ ok: false, failure: "unavailable" });
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort, { once: true });
    const done = (result: { ok: true } | { ok: false; failure: UploadFailure | "aborted" }) => {
      signal.removeEventListener("abort", abort);
      resolve(result);
    };
    xhr.open("POST", `${url}/storage/v1/object/${MENU_BUCKET}/${path}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("Authorization", `Bearer ${key}`);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return done({ ok: true });
      const failure = uploadFailure(xhr.status, xhr.responseText ?? "");
      done(failure === "exists" ? { ok: true } : { ok: false, failure });
    };
    xhr.onerror = () => done({ ok: false, failure: "network" });
    xhr.onabort = () => done({ ok: false, failure: "aborted" });
    if (signal.aborted) return done({ ok: false, failure: "aborted" });
    xhr.send(file);
  });
}

type SubmitArgs = {
  p_id: string;
  p_restaurant_name: string;
  p_maps_url: string;
  p_phone: string;
  p_contact_name: string | null;
  p_file_paths: string[];
  p_source: string;
  p_locale: string;
};

/** Records the submission once its files are uploaded. */
export async function submitMenu(args: SubmitArgs): Promise<{ ok: true } | { ok: false; failure: ReturnType<typeof submitFailure> }> {
  const db = getBrowserClient();
  if (!db) return { ok: false, failure: "unavailable" };
  try {
    const { error } = await db.rpc("submit_menu", args);
    return error ? { ok: false, failure: submitFailure(error) } : { ok: true };
  } catch {
    return { ok: false, failure: "retry" };
  }
}
