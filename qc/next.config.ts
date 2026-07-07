import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This app lives in a nested `qc/` dir alongside the FAMMS app; both have
  // lockfiles. Pin the workspace root to this dir so Turbopack stops guessing.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // Reference-library photos / attachments are served from Supabase Storage
    // public URLs (https://<project>.supabase.co/storage/v1/object/public/...).
    // next/image refuses to load remote hosts that aren't allowlisted.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Client-side router cache. By default dynamic pages have a 0s stale time, so
  // every bottom-nav switch re-hits the server (auth check + Supabase queries),
  // which makes tab switching feel slow — especially toggling back and forth.
  // Keeping visited pages for a short window makes re-visits instant; data is at
  // most this many seconds stale, which is fine for this app (a refresh/navigation
  // still revalidates).
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
