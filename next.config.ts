import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  outputFileTracingExcludes: {
    '*': [
      './data/sources/**/*',
      './data/remedies.json.bak-*',
      './data/remedies-by-id.json',
      './scripts/**/*',
      './upload/**/*',
      './tool-results/**/*',
      './skills/**/*',
    ],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
