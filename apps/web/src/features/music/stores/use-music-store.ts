import { create } from "zustand";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  coverArt: string;
}

export const DEFAULT_TRACK: MusicTrack = {
  id: "default-bgm",
  title: "책 읽을 때 듣는 음악",
  artist: "북적 BGM",
  src: "https://www.youtube.com/watch?v=fF6x1ta9j1w&list=RDfF6x1ta9j1w&start_radio=1",
  coverArt: "https://img.youtube.com/vi/fF6x1ta9j1w/hqdefault.jpg",
};

interface MusicStoreState {
  isPlaying: boolean;
  isModalOpen: boolean;
  currentTrack: MusicTrack;
  volume: number; // 0 ~ 100

  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  toggleModal: () => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setVolume: (volume: number) => void;
  setTrack: (track: MusicTrack) => void;
}

export const useMusicStore = create<MusicStoreState>((set) => ({
  isPlaying: false,
  isModalOpen: false,
  currentTrack: DEFAULT_TRACK,
  volume: 80,

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  setIsModalOpen: (isModalOpen) => set({ isModalOpen }),
  setVolume: (volume) => set({ volume }),
  setTrack: (currentTrack) => set({ currentTrack, isPlaying: true }),
}));
