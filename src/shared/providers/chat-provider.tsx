"use client";

import { useAuthStore } from "@/features/auth/store";
import { ChatToggleButton } from "@/features/chat/components/chat-toggle-button";
import { ChatWidget } from "@/features/chat/components/chat-widget";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);

  useChatEvents();

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
