import { create } from "zustand";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  coverArt: string;
}

export type RepeatMode = "all" | "one" | "off";

export const DEFAULT_PLAYLIST: MusicTrack[] = [
  {
    id: "bgm-1",
    title: "Let's Fall in Love",
    artist: "Ella Fitzgerald",
    src: "https://www.youtube.com/watch?v=fF6x1ta9j1w",
    coverArt: "https://img.youtube.com/vi/fF6x1ta9j1w/hqdefault.jpg",
  },
  {
    id: "bgm-2",
    title: "Ashitaka and San (모노노케 히메)",
    artist: "Joe Hisaishi",
    src: "https://www.youtube.com/watch?v=faf98cNY8A8",
    coverArt: "https://img.youtube.com/vi/faf98cNY8A8/hqdefault.jpg",
  },
  {
    id: "bgm-3",
    title: "The Devil's Hand",
    artist: "J Paul Getto",
    src: "https://www.youtube.com/watch?v=9vm9uwNCRCI",
    coverArt: "https://img.youtube.com/vi/9vm9uwNCRCI/hqdefault.jpg",
  },
  {
    id: "bgm-4",
    title: "At Last",
    artist: "Etta James",
    src: "https://www.youtube.com/watch?v=cZag0E32is0",
    coverArt: "https://img.youtube.com/vi/cZag0E32is0/hqdefault.jpg",
  },
];

interface MusicStoreState {
  isPlaying: boolean;
  isModalOpen: boolean;
  playlist: MusicTrack[];
  currentIndex: number;
  repeatMode: RepeatMode;
  volume: number; // 0 ~ 100

  // Derived getter helper
  getCurrentTrack: () => MusicTrack;

  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  toggleModal: () => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setVolume: (volume: number) => void;
  cycleRepeatMode: () => void;
  playNext: () => void;
  playPrev: () => void;
  setTrackIndex: (index: number) => void;
  setPlaylist: (tracks: MusicTrack[]) => void;
  addTrack: (track: MusicTrack) => void;
}

export const useMusicStore = create<MusicStoreState>((set, get) => ({
  isPlaying: false,
  isModalOpen: false,
  playlist: DEFAULT_PLAYLIST,
  currentIndex: 0,
  repeatMode: "all",
  volume: 80,

  getCurrentTrack: () => {
    const { playlist, currentIndex } = get();
    return playlist[currentIndex] || DEFAULT_PLAYLIST[0];
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setVolume: (volume) => set({ volume }),

  cycleRepeatMode: () =>
    set((state) => {
      const modes: RepeatMode[] = ["all", "one", "off"];
      const nextIdx = (modes.indexOf(state.repeatMode) + 1) % modes.length;
      return { repeatMode: modes[nextIdx] };
    }),

  playNext: () =>
    set((state) => {
      const { playlist, currentIndex, repeatMode } = state;
      if (playlist.length === 0) return {};

      if (repeatMode === "one") {
        return { isPlaying: true };
      }

      if (currentIndex + 1 < playlist.length) {
        return { currentIndex: currentIndex + 1, isPlaying: true };
      }

      if (repeatMode === "all") {
        return { currentIndex: 0, isPlaying: true };
      }

      // repeatMode === "off" and reached end
      return { isPlaying: false };
    }),

  playPrev: () =>
    set((state) => {
      const { playlist, currentIndex, repeatMode } = state;
      if (playlist.length === 0) return {};

      if (currentIndex > 0) {
        return { currentIndex: currentIndex - 1, isPlaying: true };
      }

      if (repeatMode === "all") {
        return { currentIndex: playlist.length - 1, isPlaying: true };
      }

      return { currentIndex: 0, isPlaying: true };
    }),

  setTrackIndex: (index: number) =>
    set((state) => {
      if (index >= 0 && index < state.playlist.length) {
        return { currentIndex: index, isPlaying: true };
      }
      return {};
    }),

  setPlaylist: (playlist: MusicTrack[]) =>
    set({ playlist, currentIndex: 0, isPlaying: true }),

  addTrack: (track: MusicTrack) =>
    set((state) => ({
      playlist: [...state.playlist, track],
    })),
}));
