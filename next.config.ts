import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily ignore ESLint errors during builds on this feature branch
  // to allow UI development without blocking. Keep ESLint in dev/CI.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
