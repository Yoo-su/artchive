import { NEOGULIP_TEXTS, RecommendedBook } from "@bookjeok/core/llm";
import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  recommendedBooks: RecommendedBook[];
  setRecommendedBooks: (books: RecommendedBook[]) => void;
  isFinal: boolean;
  setIsFinal: (isFinal: boolean) => void;
}

export const useRecommendStore = create<RecommendStore>()(
  persist(
    (set) => ({
      messages: [
        {
          id: "greeting",
          text: NEOGULIP_TEXTS.GREETING,
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
              text: NEOGULIP_TEXTS.GREETING,
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
