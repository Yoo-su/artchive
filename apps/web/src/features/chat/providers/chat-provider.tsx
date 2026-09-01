"use client";

import { useMyChatRoomsQuery } from "@bookjeok/react-query";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { ChatToggleButton } from "@/features/chat/components/widgets/chat-toggle-button";
import { ChatWidget } from "@/features/chat/components/widgets/chat-widget";
import { useChatEvents } from "@/features/chat/hooks/use-chat-events";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { HIDE_CHAT_WIDGET_ROUTES } from "../constants/routes";

/** joinRooms ack 대기 제한 시간 */
const JOIN_ACK_TIMEOUT_MS = 10_000;
/** joinRooms 최대 시도 횟수 */
const MAX_JOIN_ATTEMPTS = 3;
/** joinRooms 재시도 기본 대기 시간 (시도마다 2배씩 증가) */
const JOIN_RETRY_BASE_MS = 1_000;

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
  const t = useTranslations("chat");
  const tRef = useRef(t);
  tRef.current = t;
  const hasWarnedJoinFailureRef = useRef(false);
  const { registerChatEventListeners, unregisterChatEventListeners } =
    useChatEvents();
  const hasJoinedRooms = useChatStore((state) => state.hasJoinedRooms);
  const setHasJoinedRooms = useChatStore((state) => state.setHasJoinedRooms);
  const { data: rooms, isSuccess: isRoomsLoaded } = useMyChatRoomsQuery({
    enabled: !!user,
  });

  // 방 목록 캐시는 메시지가 올 때마다 새 배열로 교체되고 정렬 순서도 바뀝니다.
  // 배열 자체를 의존성으로 두면 입장 요청이 불필요하게 다시 나가므로,
  // 참여할 방 ID 집합이 실제로 달라졌을 때만 재실행되도록 키로 비교합니다.
  const roomIdsKey = (rooms ?? [])
    .map((room) => room.id)
    .sort((a, b) => a - b)
    .join(",");

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
  // 입장에 실패하면 실시간 메시지를 전혀 받지 못하므로, 재시도하고 끝내 실패하면 알립니다.
  useEffect(() => {
    if (!isConnected || !socket || !isRoomsLoaded || hasJoinedRooms) {
      return;
    }

    const roomIds = roomIdsKey === "" ? [] : roomIdsKey.split(",").map(Number);
    if (roomIds.length === 0) {
      setHasJoinedRooms(true);
      return;
    }

    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const join = () => {
      socket
        .timeout(JOIN_ACK_TIMEOUT_MS)
        .emit(
          "joinRooms",
          roomIds,
          (
            timeoutError: Error | null,
            response?: { status: string; joinedRooms?: number[] },
          ) => {
            if (cancelled) return;

            if (!timeoutError && response?.status === "ok") {
              hasWarnedJoinFailureRef.current = false;
              setHasJoinedRooms(true);
              return;
            }

            attempt += 1;
            console.error(
              `Failed to join chat rooms (attempt ${attempt}/${MAX_JOIN_ATTEMPTS}):`,
              timeoutError ?? response,
            );

            if (attempt >= MAX_JOIN_ATTEMPTS) {
              // 같은 실패로 토스트가 반복되지 않도록 성공할 때까지 한 번만 알립니다.
              if (!hasWarnedJoinFailureRef.current) {
                hasWarnedJoinFailureRef.current = true;
                toast.error(tRef.current("toast.join_failed"));
              }
              return;
            }

            retryTimer = setTimeout(
              join,
              JOIN_RETRY_BASE_MS * 2 ** (attempt - 1),
            );
          },
        );
    };

    join();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [
    isConnected,
    socket,
    isRoomsLoaded,
    roomIdsKey,
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
