"use client";

import { Copy, Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useToast } from "@/components/providers";
import { Card, CardTitle } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import type { Restaurant } from "@/lib/types";

export function QrCard({ restaurant: r }: { restaurant: Restaurant }) {
  const { t, pick } = useI18n();
  const toast = useToast();
  const [svg, setSvg] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const target = `${location.origin}/r/${r.slug}?utm_source=qr`;
    let live = true;
    QRCode.toString(target, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#17140f", light: "#ffffff" } })
      .then((s) => {
        if (!live) return;
        setUrl(target);
        setSvg(s);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [r.slug]);

  const download = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${r.slug}-menu-qr.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(t.dashboard.qrDownloaded);
  };

  return (
    <Card>
      <CardTitle>{t.dashboard.qrTitle}</CardTitle>
      {/* Table-tent preview in the restaurant's color. */}
      <div className="rounded-xl bg-accent p-5 text-on-accent">
        <p className="text-xl font-semibold">{pick(r.name, r.nameAr)}</p>
        <p className="mt-0.5 text-sm opacity-80">{t.dashboard.qrTagline}</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="size-31 rounded-lg bg-white p-3">
            {svg ? (
              <div className="size-full animate-fade [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <div className="skeleton size-full rounded-lg" />
            )}
          </div>
          <p className="max-w-28 pb-1 text-end text-xs opacity-75">{t.dashboard.qrNote}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={download}
          disabled={!svg}
          className="pressable flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-ink text-sm font-medium text-bg disabled:opacity-40"
        >
          <Download className="size-4" strokeWidth={2.2} /> {t.dashboard.downloadSvg}
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard?.writeText(url).catch(() => {});
            toast(t.menu.copied);
          }}
          className="pressable flex h-10 items-center justify-center gap-2 rounded-lg bg-surface-2 px-4 text-sm font-medium text-ink"
        >
          <Copy className="size-4" strokeWidth={2.2} /> {t.dashboard.link}
        </button>
      </div>
    </Card>
  );
}
