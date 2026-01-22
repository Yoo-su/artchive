import { create } from "zustand";
import { persist } from "zustand/middleware";

import { NEOGULIP_THEME } from "../constants/neogulip-theme";

interface Message {
  id: string;
  text: string;
  isAi: boolean;
}

interface RecommendStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  recommendedBooks: any[]; // Using any for simplicity here to match frontend BookItem, but ideally shared type
  setRecommendedBooks: (books: any[]) => void;
  isFinal: boolean;
  setIsFinal: (isFinal: boolean) => void;
}

export const useRecommendStore = create<RecommendStore>()(
  persist(
    (set) => ({
      messages: [
        {
          id: "greeting",
          text: NEOGULIP_THEME.TEXTS.GREETING,
          isAi: true,
        },
      ],
      recommendedBooks: [],
      isFinal: false,
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      setMessages: (messages) => set({ messages }),
      setRecommendedBooks: (books) => set({ recommendedBooks: books }),
      clearMessages: () =>
        set({
          messages: [
            {
              id: "greeting",
              text: NEOGULIP_THEME.TEXTS.GREETING,
              isAi: true,
            },
          ],
          recommendedBooks: [],
          isFinal: false,
        }),
      setIsFinal: (isFinal) => set({ isFinal }),
    }),
    {
      name: "recommend-storage", // localStorage key
    },
  ),
);
