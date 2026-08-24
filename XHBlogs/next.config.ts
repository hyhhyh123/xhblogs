import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 🔧 修复 Turbopack NFT 追踪失败导致的 ENOENT 错误
  outputFileTracingIncludes: {
    '/**/*': [
      './posts/**/*',
      './chatters/**/*',
      './moments/**/*',
      './data/**/*',
      './app/about/**/*.md',
    ],
  },
};

export default nextConfig;
