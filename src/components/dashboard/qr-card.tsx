"use client";

import { Copy, Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useToast } from "@/components/providers";
import { Card, CardTitle } from "@/components/ui";
import type { Restaurant } from "@/lib/types";

export function QrCard({ restaurant: r }: { restaurant: Restaurant }) {
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
    toast("QR code downloaded");
  };

  return (
    <Card>
      <CardTitle>Table QR code</CardTitle>
      {/* Table-tent preview in the restaurant's color. */}
      <div className="rounded-[20px] bg-accent p-5 text-on-accent">
        <p className="font-display text-[22px] leading-tight [font-variation-settings:'opsz'_36]">{r.name}</p>
        <p className="mt-0.5 text-[12.5px] opacity-80">Scan for our menu & prices</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="size-[124px] rounded-2xl bg-white p-3 shadow-md">
            {svg ? (
              <div className="size-full animate-fade [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <div className="skeleton size-full rounded-lg" />
            )}
          </div>
          <p className="pb-1 text-right text-[11px] leading-snug opacity-70">
            Always shows
            <br />
            your latest menu
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={download}
          disabled={!svg}
          className="pressable flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-ink text-[13.5px] font-medium text-bg disabled:opacity-40"
        >
          <Download className="size-4" strokeWidth={2.2} /> Download SVG
        </button>
        <button
          onClick={async () => {
            await navigator.clipboard?.writeText(url).catch(() => {});
            toast("Menu link copied");
          }}
          className="pressable flex h-10 items-center justify-center gap-2 rounded-full bg-surface-2 px-4 text-[13.5px] font-medium text-ink"
        >
          <Copy className="size-4" strokeWidth={2.2} /> Link
        </button>
      </div>
    </Card>
  );
}
