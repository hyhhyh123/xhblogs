import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 🔧 修复 Turbopack NFT 追踪失败导致的 ENOENT 错误
  // 问题：Turbopack 无法追踪动态读取的 markdown 文件路径
  // 导致 posts/chatters/moments 等内容目录没被打包进构建输出
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
