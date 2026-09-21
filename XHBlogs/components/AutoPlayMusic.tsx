"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 🎵 极简背景音乐（手动播放）
 * - 不再自动播放，避免与 /music 页面冲突
 * - 右下角迷你按钮：用户手动点击播放/暂停 /bg-music.mp3
 * - 零依赖：只有一个 <audio>，不加载任何外部资源
 */
export default function AutoPlayMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio("/bg-music.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label={playing ? "暂停音乐" : "播放音乐"}
      title={playing ? "暂停音乐" : "播放音乐"}
      className="fixed bottom-6 right-6 z-[9999] flex h-11 w-11 items-center justify-center rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-base shadow-xl backdrop-blur-xl border border-white/40 dark:border-white/10 transition-all duration-300 hover:scale-110 active:scale-95"
    >
      {playing ? "⏸" : "▶"}
    </button>
  );
}
