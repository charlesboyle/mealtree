import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Menu photos are downscaled in the browser; 4mb leaves room for several.
    serverActions: { bodySizeLimit: "4mb" },
    // Public pages (/[lang]) and /ops have separate root layouts, so the 404 for
    // unmatched URLs lives in app/global-not-found.tsx.
    globalNotFound: true,
  },
};

export default nextConfig;
