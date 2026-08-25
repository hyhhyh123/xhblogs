"use client";

import Script from "next/script";

// 🌟 改用 Giscus（基于 GitHub Discussions，无 OAuth redirect_uri 问题）
// 配置通过 data-* 属性传入，由 giscus.app 自动注入。
// repo-id / category-id 已根据 hyhhyh123/xhblogs 仓库实际值填写。
export default function Comments() {
  return (
    <div className="w-full mt-16 relative">
      {/* 🌟 视觉特效：底部环境光晕（保留氛围感） */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        {/* Giscus 挂载容器 */}
        <div className="giscus"></div>

        <Script
          src="https://giscus.app/client.js"
          data-repo="hyhhyh123/xhblogs"
          data-repo-id="R_kgDOUCdzyQ"
          data-category="General"
          data-category-id="DIC_kwDOUCdzyc4DEIw-"
          data-mapping="pathname"
          data-strict="0"
          data-reactions-enabled="1"
          data-emit-metadata="0"
          data-input-position="bottom"
          data-theme="light_high_contrast"
          data-lang="zh-CN"
          data-loading="lazy"
          strategy="afterInteractive"
        />
      </div>
    </div>
  );
}
