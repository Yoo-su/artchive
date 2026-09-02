"use client";

import { useMarkRoomAsReadMutation } from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useSocketContext } from "@/shared/providers/socket-provider";

import { markRoomReadInCache } from "../utils/chat-cache-utils";

/**
 * 채팅방을 읽음 처리합니다.
 *
 * 안 읽음 배지는 캐시에서 즉시 지우고(낙관적), 서버 기록은 소켓으로 보냅니다.
 * 소켓이 끊겨 있을 때만 HTTP 요청으로 대체하므로, 같은 읽음 처리가
 * 두 경로로 중복 전송되지 않습니다.
 */
export const useMarkRoomAsRead = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { mutate: markRoomAsReadViaHttp } = useMarkRoomAsReadMutation();

  return useCallback(
    (roomId: number) => {
      markRoomReadInCache(queryClient, roomId);

      if (socket?.connected) {
        socket.emit("markAsRead", { roomId });
        return;
      }

      markRoomAsReadViaHttp(roomId);
    },
    [socket, queryClient, markRoomAsReadViaHttp],
  );
};
