"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useChatStore } from "../stores/use-chat-store";
import { markRoomReadInCache } from "../utils/chat-cache-utils";

/**
 * 채팅방을 열면서 안 읽음 배지를 즉시 지웁니다.
 *
 * 서버 읽음 기록은 방이 실제로 보이는 동안 `ChatRoom`이 마지막 메시지 기준으로
 * 한 번만 보냅니다. 여기서 따로 요청하면 방을 열 때마다 같은 처리가 두 번 나갑니다.
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
