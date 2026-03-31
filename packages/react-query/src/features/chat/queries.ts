"use client";
import { getChatMessages, getMyChatRooms } from "@bookjeok/api-client";
import { chatKeys, CACHE_TIME, ChatRoom } from "@bookjeok/core";
import { useInfiniteQuery, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 내 채팅방 목록 조회
 */
export const useMyChatRoomsQuery = (
  client: AxiosInstance,
  options?: Omit<UseQueryOptions<ChatRoom[]>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: chatKeys.rooms.queryKey,
    queryFn: () => getMyChatRooms(client),
    staleTime: CACHE_TIME.THIRTY_SECONDS,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * 채팅 메시지 히스토리 조회 (무한 스크롤)
 */
export const useInfiniteChatMessagesQuery = (roomId: number | null, client: AxiosInstance) => {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(roomId!).queryKey,
    queryFn: ({ pageParam }) =>
      getChatMessages(client, roomId!, 1, 20, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getPreviousPageParam: (firstPage) => {
      return firstPage.nextCursor ?? undefined;
    },
    getNextPageParam: () => undefined,
    enabled: !!roomId,
    refetchOnWindowFocus: false,
    staleTime: CACHE_TIME.INFINITY,
  });
};
