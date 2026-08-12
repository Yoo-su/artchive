"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { ChatToggleButton } from "@/features/chat/components/widgets/chat-toggle-button";
import { ChatWidget } from "@/features/chat/components/widgets/chat-widget";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";
import { useMyChatRoomsQuery } from "@/features/chat/queries";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { HIDE_CHAT_WIDGET_ROUTES } from "../constants/routes";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const isWidgetHidden = (() => {
    if (!pathname) return false;
    const cleanPath = `/${pathname.split("/").slice(2).join("/")}`;
    return HIDE_CHAT_WIDGET_ROUTES.some((route) => cleanPath.startsWith(route));
  })();

  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const currentUser = mounted ? user : null;
  const { socket, isConnected } = useSocketContext();
  const { registerChatEventListeners, unregisterChatEventListeners } =
    useChatEvents();
  const hasJoinedRooms = useChatStore((state) => state.hasJoinedRooms);
  const setHasJoinedRooms = useChatStore((state) => state.setHasJoinedRooms);
  const { data: rooms, isSuccess: isRoomsLoaded } = useMyChatRoomsQuery({
    enabled: !!user,
  });

  // Effect 1: 이벤트 리스너 생명주기 관리 및 재연결 리스너
  useEffect(() => {
    if (user && isConnected && socket) {
      registerChatEventListeners();

      const handleReconnect = () => {
        setHasJoinedRooms(false);
      };

      socket.on("connect", handleReconnect);

      return () => {
        socket.off("connect", handleReconnect);
        unregisterChatEventListeners();
      };
    }
  }, [
    user,
    isConnected,
    socket,
    registerChatEventListeners,
    unregisterChatEventListeners,
    setHasJoinedRooms,
  ]);

  // Effect 2: 채팅방 입장 처리
  useEffect(() => {
    if (isConnected && socket && isRoomsLoaded && rooms && !hasJoinedRooms) {
      const roomIds = rooms.map((room) => room.id);
      if (roomIds.length > 0) {
        socket.emit(
          "joinRooms",
          roomIds,
          (response: { status: string; joinedRooms: number[] }) => {
            if (response.status === "ok") {
              setHasJoinedRooms(true);
            } else {
              console.error("Failed to join rooms from provider");
            }
          },
        );
      } else {
        setHasJoinedRooms(true);
      }
    }
  }, [
    isConnected,
    socket,
    isRoomsLoaded,
    rooms,
    hasJoinedRooms,
    setHasJoinedRooms,
  ]);

  // Effect 3: 로그아웃 초기화
  useEffect(() => {
    if (!user || !isConnected) {
      setHasJoinedRooms(false);
    }
  }, [user, isConnected, setHasJoinedRooms]);

  return (
    <>
      {children}
      {currentUser && !isWidgetHidden && (
        <>
          <ChatToggleButton />
          <ChatWidget />
        </>
      )}
    </>
  );
};
