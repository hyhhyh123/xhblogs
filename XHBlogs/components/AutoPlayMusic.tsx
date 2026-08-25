"use client";
import { useEffect, useRef, useState } from "react";

export default function AutoPlayMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.6;
    audio.loop = true;

    const timer = setTimeout(() => {
      if (audio && !isPlaying) {
        audio.play().then(() => setIsPlaying(true)).catch(() => {
          const startPlay = () => {
            if (audio && !isPlaying) {
              audio.play().then(() => setIsPlaying(true)).catch(() => {});
            }
            document.removeEventListener("click", startPlay);
            document.removeEventListener("touchstart", startPlay);
            document.removeEventListener("keydown", startPlay);
          };
          document.addEventListener("click", startPlay);
          document.addEventListener("touchstart", startPlay);
          document.addEventListener("keydown", startPlay);
        });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <audio ref={audioRef} src="/bg-music.mp3" />
      <button
        onClick={togglePlay}
        className="w-12 h-12 rounded-full bg-indigo-500/80 backdrop-blur-xl border border-white/30 shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer
        "
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
    </div>
  );
}

