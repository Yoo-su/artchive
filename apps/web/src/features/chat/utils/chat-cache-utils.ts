import { chatKeys, ChatMessage, ChatRoom } from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";

type InfiniteMessagesData = {
  pages: { messages: ChatMessage[] }[];
  pageParams: (number | undefined)[];
};

/**
 * 채팅 메시지 캐시 조작 유틸리티
 *
 * useChatEvents 훅에서 사용되는 캐시 갱신 로직을 추출하여
 * 단일 책임 원칙을 준수하고, 테스트 가능성을 높였습니다.
 */

/**
 * 메시지를 특정 채팅방의 메시지 캐시 맨 앞에 추가합니다.
 */
export const prependMessageToCache = (
  queryClient: QueryClient,
  roomId: number,
  message: ChatMessage,
) => {
  queryClient.setQueryData<InfiniteMessagesData>(
    chatKeys.messages(roomId).queryKey,
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
};

/**
 * 낙관적 메시지를 실제 서버 응답 메시지로 교체합니다.
 * 낙관적 메시지가 없으면 캐시 맨 앞에 새 메시지를 추가합니다.
 *
 * FIFO 방식으로 가장 오래된 낙관적 메시지(ID < 0)부터 교체합니다.
 */
export const replaceOptimisticMessage = (
  queryClient: QueryClient,
  roomId: number,
  newMessage: ChatMessage,
): void => {
  queryClient.setQueryData<InfiniteMessagesData>(
    chatKeys.messages(roomId).queryKey,
    (oldData) => {
      if (!oldData) return oldData;

      // 가장 오래된 낙관적 메시지 탐색 (역순 순회)
      let targetPageIdx = -1;
      let targetMsgIdx = -1;

      for (let i = oldData.pages.length - 1; i >= 0; i--) {
        const page = oldData.pages[i];
        for (let j = page.messages.length - 1; j >= 0; j--) {
          if (page.messages[j].id < 0) {
            targetPageIdx = i;
            targetMsgIdx = j;
            break;
          }
        }
        if (targetPageIdx !== -1) break;
      }

      // 낙관적 메시지를 찾았으면 교체
      if (targetPageIdx !== -1 && targetMsgIdx !== -1) {
        const newPages = [...oldData.pages];
        const targetPage = { ...newPages[targetPageIdx] };
        const newMessages = [...targetPage.messages];
        newMessages[targetMsgIdx] = newMessage;
        targetPage.messages = newMessages;
        newPages[targetPageIdx] = targetPage;
        return { ...oldData, pages: newPages };
      }

      // 낙관적 메시지가 없으면 맨 앞에 추가
      const newPages = [...oldData.pages];
      newPages[0] = {
        ...newPages[0],
        messages: [newMessage, ...newPages[0].messages],
      };
      return { ...oldData, pages: newPages };
    },
  );
};

/**
 * 채팅방 목록의 마지막 메시지와 안읽음 카운트를 갱신하고
 * 최신 메시지 기준으로 재정렬합니다.
 */
export const updateRoomLastMessage = (
  queryClient: QueryClient,
  roomId: number,
  message: ChatMessage,
  isViewing: boolean,
): void => {
  let roomFound = false;

  queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms.queryKey, (oldRooms) => {
    if (!oldRooms) return oldRooms;

    const updatedRooms = oldRooms.map((room) => {
      if (room.id === roomId) {
        roomFound = true;
        return {
          ...room,
          lastMessage: message,
          unreadCount: isViewing ? 0 : (room.unreadCount || 0) + 1,
        };
      }
      return room;
    });

    return updatedRooms.sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt ?? 0).getTime() -
        new Date(a.lastMessage?.createdAt ?? 0).getTime(),
    );
  });

  // 캐시에 해당 방이 없거나 아직 로드되지 않은 경우 방 목록 쿼리 무효화하여 최신 안읽음 뱃지 동기화
  if (!roomFound) {
    queryClient.invalidateQueries({
      queryKey: chatKeys.rooms.queryKey,
    });
  }
};
