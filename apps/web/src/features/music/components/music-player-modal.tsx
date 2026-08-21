"use client";

import { Disc3, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";

import { MusicPlayer } from "@/shared/components/componentry/music-player";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

import { useMusicStore } from "../stores/use-music-store";

export function MusicPlayerModal() {
  const t = useTranslations("music");
  const isModalOpen = useMusicStore((state) => state.isModalOpen);
  const setIsModalOpen = useMusicStore((state) => state.setIsModalOpen);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const togglePlay = useMusicStore((state) => state.togglePlay);
  const currentTrack = useMusicStore((state) => state.currentTrack);
  const volume = useMusicStore((state) => state.volume);
  const setVolume = useMusicStore((state) => state.setVolume);

  const trackTitle =
    currentTrack.id === "default-bgm"
      ? t("default_track.title")
      : currentTrack.title;

  const trackArtist =
    currentTrack.id === "default-bgm"
      ? t("default_track.artist")
      : currentTrack.artist;

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className="max-w-md overflow-hidden rounded-3xl border border-stone-200/90 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Disc3
              className={`h-5 w-5 text-stone-900 ${isPlaying ? "animate-spin" : ""}`}
              style={{ animationDuration: "3s" }}
            />
            <DialogTitle className="font-serif text-base font-bold tracking-tight text-stone-900">
              {t("title")}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* LP 턴테이블 메인 플레이어 */}
        <div className="flex flex-col items-center justify-center py-4">
          <MusicPlayer
            src={currentTrack.src}
            coverArt={currentTrack.coverArt}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            disableInternalAudio={true}
          />

          {/* 트랙 정보 */}
          <div className="mt-6 text-center">
            <h3 className="font-serif text-lg font-bold tracking-tight text-stone-900">
              {trackTitle}
            </h3>
            <p className="mt-1 text-xs font-medium text-stone-500">
              {trackArtist}
            </p>
          </div>

          {/* 컨트롤 바 */}
          <div className="mt-6 flex w-full flex-col gap-4 border-t border-stone-100 pt-5">
            {/* 재생/일시정지 메인 버튼 */}
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                onClick={togglePlay}
                size="icon"
                className="h-13 w-13 rounded-full bg-stone-900 text-white shadow-md transition-transform hover:scale-105 hover:bg-stone-800 active:scale-95"
                aria-label={isPlaying ? t("controls.pause") : t("controls.play")}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="ml-0.5 h-6 w-6 fill-current" />
                )}
              </Button>
            </div>

            {/* 볼륨 컨트롤 */}
            <div className="flex items-center justify-center gap-2.5 px-4">
              <button
                type="button"
                onClick={() => setVolume(volume > 0 ? 0 : 80)}
                className="text-stone-400 transition-colors hover:text-stone-700"
                title={volume === 0 ? t("controls.unmute") : t("controls.mute")}
              >
                {volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-stone-200 accent-stone-900"
              />
              <span className="w-6 font-mono text-[10px] text-stone-400">
                {volume}%
              </span>
            </div>
          </div>
        </div>

        {/* 닫기 안내 문구 */}
        <div className="border-t border-stone-100 pt-3 text-center">
          <p className="text-[11px] text-stone-400">
            {t("tip")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
