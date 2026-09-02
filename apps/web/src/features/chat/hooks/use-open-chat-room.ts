"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useChatStore } from "../stores/use-chat-store";
import { markRoomReadInCache } from "../utils/chat-cache-utils";

/**
 * 채팅방을 열면서 안 읽음 배지를 즉시 제거합니다.
 * 서버 읽음 기록은 `ChatRoom`이 마지막 메시지 기준으로 한 번만 전송하므로
 * 여기서는 별도 요청하지 않습니다.
 */
export const useOpenChatRoom = () => {
  const openChatRoom = useChatStore((state) => state.openChatRoom);
  const queryClient = useQueryClient();

  return useCallback(
    (roomId: number) => {
      markRoomReadInCache(queryClient, roomId);
      openChatRoom(roomId);
    },
    [queryClient, openChatRoom],
  );
};
