import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // This tells Next.js to skip linting during the build
    ignoreDuringBuilds: true,
  },
  devIndicators: {
    buildActivityPosition: 'bottom-right',
  },
  // ADD THIS BLOCK: It prevents Webpack from trying to load ESLint
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      config.plugins = config.plugins.filter(
        (plugin: any) => plugin.constructor.name !== 'ESLintWebpackPlugin'
      );
    }
    return config;
  },
};

export default nextConfig;