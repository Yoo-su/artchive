"use client";

import { useEffect, useRef } from "react";

import { useMusicStore } from "../stores/use-music-store";

export function GlobalMusicHost() {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const currentTrack = useMusicStore((state) => state.currentTrack);
  const volume = useMusicStore((state) => state.volume);
  const setIsPlaying = useMusicStore((state) => state.setIsPlaying);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Extract YouTube ID if it's a YouTube URL
  const getYoutubeId = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
    );
    return match ? match[1] : null;
  };

  const youtubeId = currentTrack?.src ? getYoutubeId(currentTrack.src) : null;

  // Handle Play / Pause
  useEffect(() => {
    if (isPlaying) {
      if (youtubeId && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*"
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
          "*"
        );
      } else if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      if (youtubeId && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, youtubeId, volume, setIsPlaying]);

  // Handle Volume change
  useEffect(() => {
    if (youtubeId && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
        "*"
      );
    } else if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume, youtubeId]);

  if (!currentTrack) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
    >
      {youtubeId ? (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0&controls=0&playsinline=1`}
          allow="autoplay; encrypted-media"
          title="Global Persistent Music Engine"
          className="h-1 w-1 border-0"
        />
      ) : (
        <audio
          ref={audioRef}
          src={currentTrack.src}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
