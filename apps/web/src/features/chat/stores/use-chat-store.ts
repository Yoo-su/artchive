import { create } from "zustand";

interface ChatState {
  isChatOpen: boolean;
  activeChatRoomId: number | null;
  typingUsers: { [roomId: number]: string };
  isRoomInactive: { [roomId: number]: boolean };
  hasJoinedRooms: boolean;
  typingTimeouts: { [roomId: number]: NodeJS.Timeout };

  toggleChat: () => void;
  openChatRoom: (roomId: number) => void;
  closeChatRoom: () => void;
  setTyping: (roomId: number, nickname: string) => void;
  setRoomInactive: (roomId: number, isInactive: boolean) => void;
  setHasJoinedRooms: (hasJoined: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isChatOpen: false,
  activeChatRoomId: null,
  typingUsers: {},
  isRoomInactive: {},
  hasJoinedRooms: false,
  typingTimeouts: {},

  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),

  /**
   * 채팅방을 엽니다. 순수 UI 상태만 변경합니다.
   * 읽음 처리까지 필요하면 `useOpenChatRoom` 훅을 사용하세요.
   */
  openChatRoom: (roomId) => {
    set({ activeChatRoomId: roomId, isChatOpen: true });
  },

  closeChatRoom: () => {
    set({ activeChatRoomId: null });
  },

  setTyping: (roomId, nickname) => {
    const existingTimeout = get().typingTimeouts[roomId];
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (nickname) {
      // 타이핑 시작
      const timeoutId = setTimeout(() => {
        set((state) => {
          const newTypingUsers = { ...state.typingUsers };
          delete newTypingUsers[roomId];
          return { typingUsers: newTypingUsers };
        });
      }, 4000); // 4초 후 자동 만료

      set((state) => ({
        typingUsers: { ...state.typingUsers, [roomId]: nickname },
        typingTimeouts: { ...state.typingTimeouts, [roomId]: timeoutId },
      }));
    } else {
      // 타이핑 종료
      set((state) => {
        const newTypingUsers = { ...state.typingUsers };
        delete newTypingUsers[roomId];
        const newTypingTimeouts = { ...state.typingTimeouts };
        delete newTypingTimeouts[roomId];
        return {
          typingUsers: newTypingUsers,
          typingTimeouts: newTypingTimeouts,
        };
      });
    }
  },

  setRoomInactive: (roomId, isInactive) => {
    set((state) => ({
      isRoomInactive: {
        ...state.isRoomInactive,
        [roomId]: isInactive,
      },
    }));
  },

  setHasJoinedRooms: (hasJoined: boolean) => {
    set({ hasJoinedRooms: hasJoined });
  },
}));
