"use client";

import { ChatMessage, ChatRoom } from "@bookjeok/core/chat";
import { chatKeys } from "@bookjeok/react-query/chat";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useChatStore } from "../stores/use-chat-store";
import {
  prependMessageToCache,
  replaceOptimisticMessage,
  updateRoomLastMessage,
} from "../utils/chat-cache-utils";

export const useChatEvents = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { setTyping, setRoomInactive } = useChatStore();

  const handleNewChatRoom = useCallback(
    (newRoom: ChatRoom) => {
      queryClient.setQueryData<ChatRoom[]>(
        chatKeys.rooms.queryKey,
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
      const isMyMessage = newMessage.sender?.id === currentUserId;

      if (isMyMessage) {
        replaceOptimisticMessage(queryClient, roomId, newMessage);
      } else {
        prependMessageToCache(queryClient, roomId, newMessage);
      }

      // 채팅방 목록 업데이트: 마지막 메시지 & 안읽음 카운트 갱신
      updateRoomLastMessage(queryClient, roomId, newMessage, isChatVisible);
    },
    [queryClient, socket],
  );

  const handleUserLeft = useCallback(
    ({ roomId, message }: { roomId: number; message: ChatMessage }) => {
      prependMessageToCache(queryClient, roomId, message);
      setRoomInactive(roomId, true);
    },
    [queryClient, setRoomInactive],
  );

  const handleUserRejoined = useCallback(
    ({ roomId, message }: { roomId: number; message: ChatMessage }) => {
      prependMessageToCache(queryClient, roomId, message);
      setRoomInactive(roomId, false);
      queryClient.invalidateQueries({
        queryKey: chatKeys.rooms.queryKey,
      });
    },
    [queryClient, setRoomInactive],
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
