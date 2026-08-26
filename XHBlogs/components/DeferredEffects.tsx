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
    let id: number | undefined;
    if ('requestIdleCallback' in window) {
      id = window.requestIdleCallback(() => setReady(true), { timeout: 3000 });
    } else {
      id = window.setTimeout(() => setReady(true), 1500);
    }
    return () => {
      if ('requestIdleCallback' in window) {
        window.cancelIdleCallback(id as number);
      } else {
        clearTimeout(id as number);
      }
    };
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
