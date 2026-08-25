"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// 🌟 Giscus 评论区（基于 GitHub Discussions）
// 关键修复：博客是 Next.js 客户端路由（SPA），点进第二篇博客时页面不整刷，
// 必须监听 pathname 变化，每次路由切换都重新创建 Giscus 脚本，
// 否则评论区停留在第一篇博客、或直接空白。
export default function Comments() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 清空上一次挂载的 Giscus（防止重复叠加/残留旧评论）
    container.innerHTML = "";

    // 动态创建 giscus 脚本，每次路由变化重新加载
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", "hyhhyh123/xhblogs");
    script.setAttribute("data-repo-id", "R_kgDOUCdzyQ");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOUCdzyc4DEIw-");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "light_high_contrast");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");
    container.appendChild(script);

    // 清理：卸载组件时移除脚本，避免重复执行
    return () => {
      container.innerHTML = "";
    };
  }, [pathname]);

  return (
    <div className="w-full mt-16 relative">
      {/* 🌟 视觉特效：底部环境光晕（保留氛围感） */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0"></div>

      <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        {/* Giscus 挂载容器（每次路由切换自动重建） */}
        <div ref={containerRef}></div>
      </div>
    </div>
  );
}
