"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Disc3, Pause } from "@/shared/components/icons/iconsax";

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

  const isVisible =
    mounted && isPlaying && !isModalOpen && Boolean(currentTrack);

  const trackTitle = currentTrack?.title || "";
  const trackArtist = currentTrack?.artist || "";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          key="floating-music-pill"
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          aria-label={t("header_button.aria_label")}
          className="fixed bottom-6 left-6 z-40 flex items-center gap-3 rounded-full border border-stone-800 bg-stone-900/95 py-2 pl-3 pr-2 text-white shadow-2xl backdrop-blur-md"
        >
          <button
            type="button"
            onClick={toggleModal}
            className="flex items-center gap-2.5 text-left"
          >
            <Disc3
              className="h-5 w-5 animate-spin text-emerald-400 shrink-0"
              style={{ animationDuration: "3s" }}
            />
            <div className="max-w-[130px] truncate sm:max-w-[180px] min-h-[30px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrack.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <p className="truncate text-xs font-semibold tracking-tight text-white">
                    {trackTitle}
                  </p>
                  <p className="truncate text-[10px] text-stone-400">
                    {trackArtist}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </button>

          {/* 정지 버튼 with 탭 바운스 */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.88 }}
            type="button"
            onClick={togglePlay}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-800 text-stone-200 transition-colors hover:bg-stone-700 hover:text-white shrink-0 cursor-pointer"
            title={t("controls.pause")}
            aria-label={t("controls.pause")}
          >
            <Pause variant="bold" className="h-3 w-3" aria-hidden="true" />
          </motion.button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
