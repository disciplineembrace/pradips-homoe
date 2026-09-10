import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Exclude only dev-only / source PDF files from build trace.
  // Runtime data files (remedies.json, rubrics.json, etc.) MUST be included
  // so Vercel can serve them at runtime.
  outputFileTracingExcludes: {
    '*': [
      './data/sources/**/*',
      './data/remedies.json.bak-*',
      './data/remedies_backup_*',
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
