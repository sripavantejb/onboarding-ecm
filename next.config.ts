import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (avoids Next scanning the home dir).
  turbopack: {
    root: path.join(__dirname),
  },
  // pdfkit ships binary font metrics that must be loaded from node_modules at
  // runtime rather than bundled.
  serverExternalPackages: ["pdfkit"],
  experimental: {
    // Uploaded documents can be a few MB; allow larger server action / body sizes.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
