"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Disc3, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useMusicStore } from "../stores/use-music-store";

export function HeaderMusicButton() {
  const t = useTranslations("music");
  const [mounted, setMounted] = useState(false);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const togglePlay = useMusicStore((state) => state.togglePlay);
  const toggleModal = useMusicStore((state) => state.toggleModal);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8.5 w-21 rounded-full bg-stone-100/50" />;
  }

  return (
    <div className="relative flex items-center shrink-0">
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={toggleModal}
        className={`group relative flex h-8.5 w-21 items-center justify-between rounded-full border px-2.5 whitespace-nowrap shrink-0 transition-colors duration-200 ${
          isPlaying
            ? "border-stone-300 bg-stone-100/70 text-stone-900 shadow-2xs"
            : "border-stone-200/90 bg-white/90 text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
        }`}
        title={t("header_button.title")}
        aria-label={t("header_button.aria_label")}
      >
        {/* 미니 바이닐 디스크 (재생 중일 때만 부드럽게 회전) */}
        <Disc3
          className={`h-4 w-4 shrink-0 transition-all duration-300 ${
            isPlaying
              ? "animate-spin text-stone-900"
              : "text-stone-400 group-hover:text-stone-700"
          }`}
          style={{ animationDuration: "3s" }}
        />

        {/* 고정 텍스트 (재생 상태가 바뀌어도 폭 고정) */}
        <span className="font-mono text-[11px] font-semibold tracking-tight text-stone-700 select-none">
          {t("header_button.label")}
        </span>

        {/* 원클릭 퀵 재생/정지 버튼 with 마이크로 탭 바운스 */}
        <motion.span
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              togglePlay();
            }
          }}
          className={`flex h-4.5 w-4.5 items-center justify-center rounded-full transition-colors ${
            isPlaying
              ? "bg-stone-800 text-white hover:bg-stone-950"
              : "bg-stone-200/70 text-stone-600 hover:bg-stone-300 hover:text-stone-900"
          }`}
          title={isPlaying ? t("controls.pause") : t("controls.play")}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isPlaying ? "header-pause" : "header-play"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="h-2 w-2 fill-current" />
              ) : (
                <Play className="ml-0.5 h-2 w-2 fill-current" />
              )}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </motion.button>
    </div>
  );
}
