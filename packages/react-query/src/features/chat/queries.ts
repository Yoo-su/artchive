"use client";
import { getChatMessages, getMyChatRooms } from "@bookjeok/api-client";
import { CACHE_TIME, chatKeys, ChatRoom } from "@bookjeok/core";
import { useInfiniteQuery, useQuery, UseQueryOptions } from "@tanstack/react-query";

/**
 * 내 채팅방 목록 조회
 *
 * 목록 캐시는 메시지 수신마다 새 배열로 교체되므로,
 * 좁은 값만 사용하는 화면은 `select`로 구독 범위를 좁혀 리렌더를 줄입니다.
 */
export const useMyChatRoomsQuery = <TData = ChatRoom[]>(
  options?: Omit<
    UseQueryOptions<ChatRoom[], Error, TData>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<ChatRoom[], Error, TData>({
    queryKey: chatKeys.rooms.queryKey,
    queryFn: () => getMyChatRooms(),
    staleTime: CACHE_TIME.THIRTY_SECONDS,
    refetchOnWindowFocus: true,
    ...options,
  });
};

/**
 * 채팅 메시지 히스토리 조회 (무한 스크롤)
 *
 * 과거 메시지를 위로 붙이는 구조라 `fetchPreviousPage`를 사용하며,
 * 이전 페이지가 배열 앞에 붙어 `pages[0]`이 가장 오래된 페이지가 됩니다.
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
    staleTime: CACHE_TIME.INFINITY,
  });
};
