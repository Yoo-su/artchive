"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuthStore } from "@/features/auth/store";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useChatStore } from "../stores/use-chat-store";
import { ChatMessage, ChatRoom } from "../types";

type InfiniteMessagesData = {
  pages: { messages: ChatMessage[] }[];
  pageParams: (number | undefined)[];
};

export const useChatEvents = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { setTyping, setRoomInactive } = useChatStore();

  /**
   * 메시지를 특정 채팅방의 메시지 캐시 맨 앞에 추가합니다.
   * handleNewMessage, handleUserLeft, handleUserRejoined에서 공통으로 사용됩니다.
   */
  const prependMessageToCache = useCallback(
    (roomId: number, message: ChatMessage) => {
      queryClient.setQueryData<InfiniteMessagesData>(
        QUERY_KEYS.chatKeys.messages(roomId).queryKey,
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            messages: [message, ...newPages[0].messages],
          };
          return { ...oldData, pages: newPages };
        },
      );
    },
    [queryClient],
  );

  const handleNewChatRoom = useCallback(
    (newRoom: ChatRoom) => {
      queryClient.setQueryData<ChatRoom[]>(
        QUERY_KEYS.chatKeys.rooms.queryKey,
        (oldData) => {
          if (oldData) {
            // 이미 존재하는 방이면 추가하지 않음
            if (oldData.some((room) => room.id === newRoom.id)) {
              return oldData;
            }
            return [newRoom, ...oldData];
          }
          return [newRoom];
        },
      );
    },
    [queryClient],
  );

  const handleNewMessage = useCallback(
    (newMessage: ChatMessage) => {
      const roomId = newMessage.chatRoom.id;
      const currentUserId = useAuthStore.getState().user?.id;

      // 채팅 상태를 한 번만 조회하여 재사용
      const { isChatOpen, activeChatRoomId } = useChatStore.getState();
      const isChatVisible = isChatOpen && activeChatRoomId === roomId;

      // 채팅방이 현재 열려 있고 활성화된 상태라면, 즉시 읽음 처리
      if (isChatVisible) {
        socket?.emit("markAsRead", { roomId });
      }

      // 내가 보낸 메시지인 경우, 낙관적 메시지를 실제 메시지로 교체
      // 낙관적 메시지는 음수 ID를 가지고 있음
      const isMyMessage = newMessage.sender?.id === currentUserId;

      queryClient.setQueryData<InfiniteMessagesData>(
        QUERY_KEYS.chatKeys.messages(roomId).queryKey,
        (oldData) => {
          if (!oldData) return oldData;

          // 내가 보낸 메시지인 경우, 낙관적 메시지(전송 중)를 찾아 실제 응답 메시지로 교체합니다.
          if (isMyMessage) {
            /**
             * [낙관적 메시지 교체 로직: FIFO 적용]
             * 메시지 목록은 최신순(내림차순)으로 정렬되어 있으므로, 배열의 뒤쪽에 있는 메시지가 먼저 보낸 메시지입니다.
             * 따라서 배열의 역순(오래된 순)으로 탐색하여 가장 먼저 발견되는 낙관적 메시지(ID < 0)를 교체해야 합니다.
             * 이렇게 해야 연속 전송 시 순서가 꼬이는 문제를 방지할 수 있습니다.
             */
            let targetPageParamsIndex = -1;
            let targetMessageIndex = -1;

            // 1. 가장 오래된 낙관적 메시지 탐색 (역순 순회)
            for (let i = oldData.pages.length - 1; i >= 0; i--) {
              const page = oldData.pages[i];
              for (let j = page.messages.length - 1; j >= 0; j--) {
                if (page.messages[j].id < 0) {
                  targetPageParamsIndex = i;
                  targetMessageIndex = j;
                  break; // 찾음 (가장 오래된 메시지)
                }
              }
              if (targetPageParamsIndex !== -1) break;
            }

            // 2. 메시지 교체 실행
            if (targetPageParamsIndex !== -1 && targetMessageIndex !== -1) {
              const newPages = [...oldData.pages];
              const targetPage = { ...newPages[targetPageParamsIndex] };
              const newMessages = [...targetPage.messages];

              newMessages[targetMessageIndex] = newMessage;
              targetPage.messages = newMessages;
              newPages[targetPageParamsIndex] = targetPage;

              return { ...oldData, pages: newPages };
            }
          }

          // 낙관적 메시지가 없거나 상대방 메시지인 경우, 기존처럼 맨 앞에 추가
          const newPages = [...oldData.pages];
          newPages[0] = {
            ...newPages[0],
            messages: [newMessage, ...newPages[0].messages],
          };
          return { ...oldData, pages: newPages };
        },
      );

      // 채팅방 목록 업데이트: 마지막 메시지 & 안읽음 카운트 갱신
      queryClient.setQueryData<ChatRoom[]>(
        QUERY_KEYS.chatKeys.rooms.queryKey,
        (oldRooms) => {
          if (!oldRooms) return [];

          const updatedRooms = oldRooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  lastMessage: newMessage,
                  unreadCount: isChatVisible ? 0 : (room.unreadCount || 0) + 1,
                }
              : room,
          );

          // 최신 메시지 기준으로 정렬
          return updatedRooms.sort(
            (a, b) =>
              new Date(b.lastMessage?.createdAt ?? 0).getTime() -
              new Date(a.lastMessage?.createdAt ?? 0).getTime(),
          );
        },
      );
    },
    [queryClient, socket],
  );

  const handleUserLeft = useCallback(
    ({ roomId, message }: { roomId: number; message: ChatMessage }) => {
      prependMessageToCache(roomId, message);
      setRoomInactive(roomId, true);
    },
    [prependMessageToCache, setRoomInactive],
  );

  const handleUserRejoined = useCallback(
    ({ roomId, message }: { roomId: number; message: ChatMessage }) => {
      prependMessageToCache(roomId, message);
      setRoomInactive(roomId, false);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chatKeys.rooms.queryKey,
      });
    },
    [queryClient, prependMessageToCache, setRoomInactive],
  );

  const handleTyping = useCallback(
    ({ nickname, isTyping }: { nickname: string; isTyping: boolean }) => {
      const { activeChatRoomId } = useChatStore.getState();
      if (activeChatRoomId) {
        setTyping(activeChatRoomId, isTyping ? nickname : "");
      }
    },
    [setTyping],
  );

  const registerChatEventListeners = useCallback(() => {
    if (!socket) return;
    socket.on("newChatRoom", handleNewChatRoom);
    socket.on("newMessage", handleNewMessage);
    socket.on("userLeft", handleUserLeft);
    socket.on("userRejoined", handleUserRejoined);
    socket.on("typing", handleTyping);
  }, [
    socket,
    handleNewChatRoom,
    handleNewMessage,
    handleUserLeft,
    handleUserRejoined,
    handleTyping,
  ]);

  const unregisterChatEventListeners = useCallback(() => {
    if (!socket) return;
    socket.off("newChatRoom", handleNewChatRoom);
    socket.off("newMessage", handleNewMessage);
    socket.off("userLeft", handleUserLeft);
    socket.off("userRejoined", handleUserRejoined);
    socket.off("typing", handleTyping);
  }, [
    socket,
    handleNewChatRoom,
    handleNewMessage,
    handleUserLeft,
    handleUserRejoined,
    handleTyping,
  ]);

  return { registerChatEventListeners, unregisterChatEventListeners };
};
