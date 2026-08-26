// components/DeferredEffects.tsx
// 🌟 纯装饰动效统一延迟到「浏览器空闲 / 页面加载后」再挂载，不阻塞首屏
"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ClickEffect = dynamic(() => import('./ClickEffect'), { ssr: false });
const CyberCat = dynamic(() => import('./CyberCat'), { ssr: false });
const DanmakuBackground = dynamic(() => import('./DanmakuBackground'), { ssr: false });

export default function DeferredEffects() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === 'function') {
      w.requestIdleCallback(() => { if (!cancelled) setReady(true); }, { timeout: 3000 });
    } else {
      setTimeout(() => { if (!cancelled) setReady(true); }, 1500);
    }
    return () => { cancelled = true; };
  }, []);

  if (!ready) return null;

  return (
    <>
      {/* 桌面端弹幕背景 */}
      <div className="hidden md:block">
        <DanmakuBackground />
      </div>

      {/* 桌面端点击粒子 */}
      <div className="hidden md:block">
        <ClickEffect />
      </div>

      {/* 桌面端赛博猫 */}
      <div className="hidden md:block">
        <CyberCat />
      </div>
    </>
  );
}
