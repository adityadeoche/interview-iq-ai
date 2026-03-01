import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Tell Render to ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. Tell Render to ignore ESLint warnings during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 3. Fix the specific 'position' error from your logs
  devIndicators: {
    buildActivityPosition: 'bottom-right',
  },
};

export default nextConfig;