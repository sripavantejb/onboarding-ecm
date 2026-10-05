import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (avoids Next scanning the home dir).
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow local alternate hosts in dev (127.0.0.1 / LAN) so RSC + HMR are not
  // blocked — the browser often surfaces that as a misleading CORS error.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // pdfkit ships binary font metrics that must be loaded from node_modules at
  // runtime rather than bundled.
  serverExternalPackages: ["pdfkit"],
  experimental: {
    // Uploaded documents can be a few MB; allow larger server action / body sizes.
    // Also allow localhost ↔ 127.0.0.1 so Server Actions are not rejected as CSRF
    // when the user switches between those hosts (shows up as a CORS-like failure).
    serverActions: {
      bodySizeLimit: "12mb",
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;
