import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

// Analytics, recordings and exception capture run in production only, never in dev or on localhost
// (including local production builds). Capture calls are no-ops while PostHog isn't initialised.
if (process.env.NODE_ENV === "production" && !isLocalHost && posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    // api_host is our PostHog managed reverse proxy (p.nomm.ae) so ad blockers don't drop events and survey
    // answers; ui_host keeps toolbar and recording links pointing at the PostHog app itself.
    api_host: posthogHost,
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: true,
  });
}
