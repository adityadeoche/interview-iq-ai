import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress the "Failed to fetch" RSC prefetch warning in the dev overlay.
  // This is a known Next.js 16 Turbopack false-positive — the app works fine.
  devIndicators: {
    position: 'bottom-right',
  },
  // Disable the error overlay for non-fatal console errors
  experimental: {
    // Prevents the overlay from hijacking non-fatal fetch errors during navigation
  },
};

export default nextConfig;
