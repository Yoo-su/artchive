"use client";

import { useCallback, useEffect, useRef } from "react";

import { useMusicStore } from "../stores/use-music-store";

export function GlobalMusicHost() {
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const playlist = useMusicStore((state) => state.playlist);
  const currentIndex = useMusicStore((state) => state.currentIndex);
  const repeatMode = useMusicStore((state) => state.repeatMode);
  const volume = useMusicStore((state) => state.volume);
  const setIsPlaying = useMusicStore((state) => state.setIsPlaying);
  const playNext = useMusicStore((state) => state.playNext);

  const currentTrack = playlist[currentIndex] || playlist[0];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isIframeReadyRef = useRef<boolean>(false);
  const lastLoadedIdRef = useRef<string | null>(null);

  // Extract YouTube ID if it's a YouTube URL
  const getYoutubeId = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
    );
    return match ? match[1] : null;
  };

  const currentYoutubeId = currentTrack?.src ? getYoutubeId(currentTrack.src) : null;

  // Helper to send command to YouTube iframe safely
  const sendYoutubeCommand = useCallback(
    (func: string, args: unknown[] = []) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func, args }),
          "*"
        );
      }
    },
    []
  );

  // Apply volume and unmute state to YouTube / Audio
  const applyVolume = useCallback(
    (vol: number) => {
      if (currentYoutubeId) {
        if (vol === 0) {
          sendYoutubeCommand("mute");
        } else {
          sendYoutubeCommand("unMute");
          sendYoutubeCommand("setVolume", [vol]);
        }
      } else if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, vol / 100));
        audioRef.current.muted = vol === 0;
      }
    },
    [currentYoutubeId, sendYoutubeCommand]
  );

  // Initialize YouTube iframe message listener
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (typeof event.data !== "string") return;
      try {
        const parsed = JSON.parse(event.data);

        // YouTube PlayerState: onReady
        if (parsed.event === "onReady") {
          isIframeReadyRef.current = true;
          applyVolume(volume);
          if (isPlaying) {
            sendYoutubeCommand("playVideo");
          }
        }

        // YouTube PlayerState: 0 = ENDED
        if (parsed.event === "onStateChange" && parsed.info === 0) {
          if (repeatMode === "one") {
            sendYoutubeCommand("seekTo", [0, true]);
            sendYoutubeCommand("playVideo");
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
  }, [repeatMode, playNext, volume, isPlaying, applyVolume, sendYoutubeCommand]);

  // Handle Track Changes (switch video without recreating iframe DOM node)
  useEffect(() => {
    if (!currentYoutubeId) return;

    // If it's the very first render, record the initial ID
    if (!lastLoadedIdRef.current) {
      lastLoadedIdRef.current = currentYoutubeId;
      return;
    }

    // If the track ID changed
    if (lastLoadedIdRef.current !== currentYoutubeId) {
      lastLoadedIdRef.current = currentYoutubeId;

      if (isPlaying) {
        sendYoutubeCommand("loadVideoById", [currentYoutubeId]);
        // Safari fix: force unMute and volume right after loading new video
        applyVolume(volume);
        sendYoutubeCommand("playVideo");
      } else {
        sendYoutubeCommand("cueVideoById", [currentYoutubeId]);
        applyVolume(volume);
      }
    }
  }, [currentYoutubeId, isPlaying, volume, sendYoutubeCommand, applyVolume]);

  // Handle Play / Pause
  useEffect(() => {
    if (isPlaying) {
      if (currentYoutubeId) {
        applyVolume(volume);
        sendYoutubeCommand("playVideo");
      } else if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      if (currentYoutubeId) {
        sendYoutubeCommand("pauseVideo");
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentYoutubeId, volume, setIsPlaying, sendYoutubeCommand, applyVolume]);

  // Handle Volume change
  useEffect(() => {
    applyVolume(volume);
  }, [volume, applyVolume]);

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

  const handleIframeLoad = () => {
    // Handshake with YouTube Iframe API
    sendYoutubeCommand("listening");
    applyVolume(volume);
    if (isPlaying) {
      sendYoutubeCommand("playVideo");
    }
  };

  if (!currentTrack) return null;

  const initialYoutubeId = getYoutubeId(playlist[0]?.src || "");

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -left-[9999px] -top-[9999px] h-1 w-1 opacity-0"
    >
      {currentYoutubeId ? (
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${initialYoutubeId}?enablejsapi=1&autoplay=0&controls=0&playsinline=1`}
          allow="autoplay; encrypted-media"
          title="Global Persistent Music Engine"
          onLoad={handleIframeLoad}
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
