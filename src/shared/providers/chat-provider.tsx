"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store";
import { ChatToggleButton } from "@/features/chat/components/chat-toggle-button";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";
import { useChatStore } from "@/features/chat/stores/use-chat-store";

import { useSocketContext } from "./socket-provider";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const { isConnected } = useSocketContext();
  const { registerChatEventListeners, unregisterChatEventListeners } =
    useChatEvents();
  const setHasJoinedRooms = useChatStore((state) => state.setHasJoinedRooms);

  useEffect(() => {
    if (user && isConnected) {
      registerChatEventListeners();
    } else {
      setHasJoinedRooms(false);
    }

    return () => {
      if (user && isConnected) {
        unregisterChatEventListeners();
      }
    };
  }, [
    user,
    isConnected,
    registerChatEventListeners,
    unregisterChatEventListeners,
    setHasJoinedRooms,
  ]);

  return (
    <>
      {children}
      {user && (
        <>
          <ChatToggleButton />
          <ChatWidget />
        </>
      )}
    </>
  );
};
