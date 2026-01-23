"use client";

import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";

import { getChatMessages, getMyChatRooms } from "./apis";
import { chatKeys } from "./constants/query-keys";
import { ChatRoom } from "./types";

/**
 * 내 채팅방 목록 조회
 * 소켓으로 실시간 업데이트, React Query는 폴백용
 */
export const useMyChatRoomsQuery = (
  options?: Omit<UseQueryOptions<ChatRoom[]>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: chatKeys.rooms.queryKey,
    queryFn: getMyChatRooms,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * 채팅 메시지 히스토리 조회 (무한 스크롤)
 * 새 메시지는 소켓으로 수신, 이 쿼리는 이전 메시지 로딩용
 */
export const useInfiniteChatMessagesQuery = (roomId: number | null) => {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(roomId!).queryKey,
    queryFn: ({ pageParam }) =>
      getChatMessages(roomId!, 1, 20, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getPreviousPageParam: (firstPage) => {
      return firstPage.nextCursor ?? undefined;
    },
    getNextPageParam: () => undefined,
    enabled: !!roomId,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
};
