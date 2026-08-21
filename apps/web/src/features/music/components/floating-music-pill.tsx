"use client";

import { Disc3, Pause } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useMusicStore } from "../stores/use-music-store";

export function FloatingMusicPill() {
  const t = useTranslations("music");
  const [mounted, setMounted] = useState(false);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const isModalOpen = useMusicStore((state) => state.isModalOpen);
  const togglePlay = useMusicStore((state) => state.togglePlay);
  const toggleModal = useMusicStore((state) => state.toggleModal);
  const playlist = useMusicStore((state) => state.playlist);
  const currentIndex = useMusicStore((state) => state.currentIndex);

  const currentTrack = playlist[currentIndex] || playlist[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isPlaying || isModalOpen || !currentTrack) {
    return null;
  }

  const trackTitle = currentTrack.title;
  const trackArtist = currentTrack.artist;

  return (
    <aside
      aria-label={t("header_button.aria_label")}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-3 rounded-full border border-stone-800 bg-stone-900/95 py-2 pl-3 pr-2 text-white shadow-xl backdrop-blur-md transition-all duration-300 hover:scale-102"
    >
      <button
        type="button"
        onClick={toggleModal}
        className="flex items-center gap-2.5 text-left"
      >
        <Disc3
          className="h-5 w-5 animate-spin text-emerald-400"
          style={{ animationDuration: "3s" }}
        />
        <div className="max-w-[130px] truncate sm:max-w-[180px]">
          <p className="truncate text-xs font-semibold tracking-tight text-white">
            {trackTitle}
          </p>
          <p className="truncate text-[10px] text-stone-400">
            {trackArtist}
          </p>
        </div>
      </button>

      {/* 정지 버튼 */}
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-800 text-stone-200 transition-colors hover:bg-stone-700 hover:text-white"
        title={t("controls.pause")}
      >
        <Pause className="h-3 w-3 fill-current" />
      </button>
    </aside>
  );
}
