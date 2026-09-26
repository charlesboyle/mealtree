import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    // Menu photos are downscaled in the browser; 4mb leaves room for several.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
