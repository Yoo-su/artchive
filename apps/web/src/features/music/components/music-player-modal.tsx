"use client";

import {
  Disc3,
  Pause,
  Play,
  Repeat,
  Repeat1,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
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
  const playlist = useMusicStore((state) => state.playlist);
  const currentIndex = useMusicStore((state) => state.currentIndex);
  const repeatMode = useMusicStore((state) => state.repeatMode);
  const cycleRepeatMode = useMusicStore((state) => state.cycleRepeatMode);
  const playNext = useMusicStore((state) => state.playNext);
  const playPrev = useMusicStore((state) => state.playPrev);
  const volume = useMusicStore((state) => state.volume);
  const setVolume = useMusicStore((state) => state.setVolume);

  const currentTrack = playlist[currentIndex] || playlist[0];

  if (!currentTrack) return null;

  const trackTitle = currentTrack.title;
  const trackArtist = currentTrack.artist;

  const getRepeatTitle = () => {
    if (repeatMode === "all") return t("controls.repeat_all");
    if (repeatMode === "one") return t("controls.repeat_one");
    return t("controls.repeat_off");
  };

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
          {playlist.length > 1 && (
            <span className="font-mono text-xs font-medium text-stone-400">
              {currentIndex + 1} / {playlist.length}
            </span>
          )}
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
            {/* 이전곡, 재생/정지, 다음곡, 반복재생 버튼 */}
            <div className="flex items-center justify-center gap-4">
              {/* 반복 재생 토글 버튼 */}
              <button
                type="button"
                onClick={cycleRepeatMode}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  repeatMode !== "off"
                    ? "bg-stone-100 text-stone-900 hover:bg-stone-200"
                    : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                }`}
                title={getRepeatTitle()}
                aria-label={getRepeatTitle()}
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-4.5 w-4.5" />
                ) : (
                  <Repeat className="h-4.5 w-4.5" />
                )}
                {repeatMode !== "off" && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-stone-900" />
                )}
              </button>

              {/* 이전 곡 */}
              <button
                type="button"
                onClick={playPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-950 active:scale-95"
                title={t("controls.prev")}
                aria-label={t("controls.prev")}
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>

              {/* 재생 / 일시정지 메인 버튼 */}
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

              {/* 다음 곡 */}
              <button
                type="button"
                onClick={playNext}
                className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-950 active:scale-95"
                title={t("controls.next")}
                aria-label={t("controls.next")}
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>
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
          <p className="text-[11px] text-stone-400">{t("tip")}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
