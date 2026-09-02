"use client";

import { chatKeys, ChatMessage } from "@bookjeok/core";
import { useMyChatRoomsQuery } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
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

type InfiniteMessagesData = {
  pages: { messages: ChatMessage[] }[];
  pageParams: (number | undefined)[];
};

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
  const queryClient = useQueryClient();
  const t = useTranslations("chat");
  const tRef = useRef(t);
  tRef.current = t;
  const hasWarnedJoinFailureRef = useRef(false);
  /** 이 소켓이 한 번이라도 연결된 적이 있는지 (재연결 판별용) */
  const hasConnectedBeforeRef = useRef(false);
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

  /**
   * 연결이 끊긴 동안 오간 메시지는 소켓으로 받지 못했고, 메시지 캐시는
   * `staleTime: INFINITY`라 스스로 다시 받아오지 않습니다.
   * 재연결 시점에 캐시를 서버 상태에 맞춰 다시 채웁니다.
   */
  const resyncChatCaches = useCallback(() => {
    // 목록(마지막 메시지 · 안 읽음 수)은 통째로 다시 받습니다.
    queryClient.invalidateQueries({ queryKey: chatKeys.rooms.queryKey });

    const { activeChatRoomId } = useChatStore.getState();

    // 열려 있지 않은 방의 메시지 캐시는 버려서 다음에 열 때 새로 받게 합니다.
    queryClient.removeQueries({
      queryKey: chatKeys.messages._def,
      predicate: (query) => query.queryKey[2] !== activeChatRoomId,
    });

    if (activeChatRoomId === null) return;

    const activeKey = chatKeys.messages(activeChatRoomId).queryKey;

    // 열려 있는 방은 첫 페이지만 남기고 다시 받습니다.
    // 과거 페이지는 커서가 고정되어 있어 그대로 다시 받으면 새 메시지와 겹치거나
    // 사이가 비는 구간이 생기고, 첫 페이지만 남기면 화면을 비우지 않고 이어집니다.
    queryClient.setQueryData<InfiniteMessagesData>(activeKey, (oldData) => {
      if (!oldData || oldData.pages.length <= 1) return oldData;
      return {
        ...oldData,
        pages: oldData.pages.slice(-1),
        pageParams: oldData.pageParams.slice(-1),
      };
    });
    queryClient.invalidateQueries({ queryKey: activeKey });
  }, [queryClient]);

  // Effect 1: 이벤트 리스너 생명주기 관리
  useEffect(() => {
    if (user && isConnected && socket) {
      registerChatEventListeners();
      return () => {
        unregisterChatEventListeners();
      };
    }
  }, [
    user,
    isConnected,
    socket,
    registerChatEventListeners,
    unregisterChatEventListeners,
  ]);

  // Effect 2: 재연결 처리
  // 연결 상태(isConnected)로 가두면 끊긴 사이에 리스너가 떨어져 나가 재연결을
  // 놓치므로, 소켓 인스턴스 수명 동안 계속 붙여 둡니다.
  useEffect(() => {
    if (!user || !socket) return;

    // 이 이펙트가 붙기 전에 이미 연결됐다면 다음 connect는 재연결입니다.
    if (socket.connected) {
      hasConnectedBeforeRef.current = true;
    }

    const handleConnect = () => {
      // 소켓 룸 참여는 연결마다 다시 해야 합니다.
      setHasJoinedRooms(false);

      if (hasConnectedBeforeRef.current) {
        resyncChatCaches();
      }
      hasConnectedBeforeRef.current = true;
    };

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, socket, setHasJoinedRooms, resyncChatCaches]);

  // Effect 3: 채팅방 입장 처리
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

  // Effect 4: 로그아웃 / 연결 해제 시 참여 상태 초기화
  useEffect(() => {
    if (!user || !isConnected) {
      setHasJoinedRooms(false);
    }
    if (!user) {
      hasConnectedBeforeRef.current = false;
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
