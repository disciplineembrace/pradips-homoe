import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Exclude large source PDFs from the standalone build output.
  // They are dev-only inputs for OCR pipelines, NOT runtime assets.
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
};

export default nextConfig;
