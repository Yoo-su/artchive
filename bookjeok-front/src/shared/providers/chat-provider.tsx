"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { ChatToggleButton } from "@/features/chat/components/widgets/chat-toggle-button";
import { ChatWidget } from "@/features/chat/components/widgets/chat-widget";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";
import { useMyChatRoomsQuery } from "@/features/chat/queries";
import { useChatStore } from "@/features/chat/stores/use-chat-store";

import { useSocketContext } from "./socket-provider";

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useSocketContext();
  const { registerChatEventListeners, unregisterChatEventListeners } =
    useChatEvents();
  const { hasJoinedRooms, setHasJoinedRooms } = useChatStore();
  const { data: rooms, isSuccess: isRoomsLoaded } = useMyChatRoomsQuery({
    enabled: !!user,
  });

  // Effect 1: 이벤트 리스너 생명주기 관리
  // 인증/연결 상태 변경 시에만 실행되어 불필요한 재등록을 방지합니다.
  useEffect(() => {
    if (user && isConnected) {
      registerChatEventListeners();
      return () => {
        unregisterChatEventListeners();
      };
    }
  }, [
    user,
    isConnected,
    registerChatEventListeners,
    unregisterChatEventListeners,
  ]);

  // Effect 2: 채팅방 입장 처리 (일회성 동작)
  useEffect(() => {
    if (isConnected && socket && isRoomsLoaded && rooms && !hasJoinedRooms) {
      const roomIds = rooms.map((room) => room.id);
      if (roomIds.length > 0) {
        socket.emit(
          "joinRooms",
          roomIds,
          (response: { status: string; joinedRooms: number[] }) => {
            if (response.status === "ok") {
              console.log(
                "Successfully joined rooms from provider:",
                response.joinedRooms,
              );
              setHasJoinedRooms(true);
            } else {
              console.error("Failed to join rooms from provider");
            }
          },
        );
      } else {
        // 입장할 채팅방이 없어도 hasJoinedRooms를 true로 설정하여 재시도 방지
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

  // Effect 3: 로그아웃 또는 연결 해제 시 입장 상태 초기화
  useEffect(() => {
    if (!user || !isConnected) {
      setHasJoinedRooms(false);
    }
  }, [user, isConnected, setHasJoinedRooms]);

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
