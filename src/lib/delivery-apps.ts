/** Delivery apps we show a logo for, matched by the host of an order link. Icons live in public/brands. */
const APPS = [
  { id: "talabat", host: /(^|\.)talabat\.com$/ },
  { id: "keeta", host: /(^|\.)(mykeeta|keeta)\.com$/ },
  { id: "deliveroo", host: /(^|\.)deliveroo\.[a-z.]+$/ },
] as const;

/** Icon path for the delivery app behind `url`, or null for an app we have no logo for. */
export function deliveryAppIcon(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    const app = APPS.find((a) => a.host.test(host));
    return app ? `/brands/${app.id}.png` : null;
  } catch {
    return null;
  }
}
