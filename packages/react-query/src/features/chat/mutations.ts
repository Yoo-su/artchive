"use client";
import { markMessagesAsRead } from "@bookjeok/api-client";
import { chatKeys, ChatRoom } from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 채팅방의 메시지를 읽음 처리하는 뮤테이션 훅입니다.
 *
 * 안 읽음 배지를 즉시 0으로 낙관적 업데이트하고,
 * 서버 요청이 실패하면 채팅방 목록을 무효화하여 실제 상태와 다시 맞춥니다.
 */
export const useMarkRoomAsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roomId: number) => markMessagesAsRead(roomId),
    onMutate: (roomId) => {
      queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms.queryKey, (oldRooms) =>
        oldRooms?.map((room) =>
          room.id === roomId ? { ...room, unreadCount: 0 } : room,
        ),
      );
    },
    onError: (error) => {
      console.error("Failed to mark messages as read on server:", error);
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms.queryKey });
    },
  });
};
