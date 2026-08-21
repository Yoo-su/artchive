"use client";

import { useEffect, useRef } from "react";

import { useMusicStore } from "../stores/use-music-store";

export function GlobalMusicHost() {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const playlist = useMusicStore((state) => state.playlist);
  const currentIndex = useMusicStore((state) => state.currentIndex);
  const repeatMode = useMusicStore((state) => state.repeatMode);
  const volume = useMusicStore((state) => state.volume);
  const setIsPlaying = useMusicStore((state) => state.setIsPlaying);
  const playNext = useMusicStore((state) => state.playNext);

  const currentTrack = playlist[currentIndex];

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

  // Handle YouTube message events (track ended detection)
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const parsed = JSON.parse(event.data);
        // YouTube PlayerState: 0 = ENDED
        if (parsed.event === "onStateChange" && parsed.info === 0) {
          if (repeatMode === "one") {
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: "command", func: "seekTo", args: [0, true] }),
                "*"
              );
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: "command", func: "playVideo", args: [] }),
                "*"
              );
            }
          } else {
            playNext();
          }
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener("message", handleWindowMessage);
    return () => window.removeEventListener("message", handleWindowMessage);
  }, [repeatMode, playNext]);

  // Handle Play / Pause & Volume
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

  const handleAudioEnded = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      playNext();
    }
  };

  if (!currentTrack) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
    >
      {youtubeId ? (
        <iframe
          key={youtubeId}
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=${
            isPlaying ? 1 : 0
          }&controls=0&playsinline=1`}
          allow="autoplay; encrypted-media"
          title="Global Persistent Music Engine"
          className="h-1 w-1 border-0"
        />
      ) : (
        <audio
          ref={audioRef}
          src={currentTrack.src}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}
    </div>
  );
}
