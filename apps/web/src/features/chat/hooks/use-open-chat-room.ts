"use client";

import { useMarkRoomAsReadMutation } from "@bookjeok/react-query";
import { useCallback } from "react";

import { useChatStore } from "../stores/use-chat-store";

/**
 * 채팅방을 열면서 읽음 처리까지 함께 수행합니다.
 *
 * 위젯 열기/활성 방 지정은 UI 상태(`useChatStore`)가, 읽음 처리는 뮤테이션이 담당합니다.
 * 두 관심사를 호출부에서 매번 조합하지 않도록 이 훅으로 묶었습니다.
 */
export const useOpenChatRoom = () => {
  const openChatRoom = useChatStore((state) => state.openChatRoom);
  const { mutate: markRoomAsRead } = useMarkRoomAsReadMutation();

  return useCallback(
    (roomId: number) => {
      markRoomAsRead(roomId);
      openChatRoom(roomId);
    },
    [markRoomAsRead, openChatRoom],
  );
};
