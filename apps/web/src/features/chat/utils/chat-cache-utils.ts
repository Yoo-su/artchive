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
 * 특정 메시지를 캐시에서 제거합니다.
 * 전송에 실패한 낙관적 메시지를 되돌릴 때 사용합니다.
 */
export const removeMessageFromCache = (
  queryClient: QueryClient,
  roomId: number,
  messageId: number,
) => {
  queryClient.setQueryData<InfiniteMessagesData>(
    chatKeys.messages(roomId).queryKey,
    (oldData) => {
      if (!oldData) return oldData;
      const newPages = oldData.pages.map((page) => ({
        ...page,
        messages: page.messages.filter((message) => message.id !== messageId),
      }));
      return { ...oldData, pages: newPages };
    },
  );
};

/** 캐시 안에서 낙관적 메시지의 위치 */
interface OptimisticMessageLocation {
  pageIndex: number;
  messageIndex: number;
}

/**
 * 교체 대상 낙관적 메시지의 위치를 찾습니다.
 *
 * - 상관 ID가 있으면 정확히 일치하는 메시지만 대상으로 삼습니다.
 *   일치하는 것이 없다면 다른 탭/기기에서 보낸 메시지이므로 교체하지 않습니다.
 * - 상관 ID가 없으면(구버전 서버) 기존 방식대로 가장 오래된 낙관적 메시지를 대상으로 합니다.
 */
const findOptimisticTarget = (
  data: InfiniteMessagesData,
  clientMessageId?: string,
): OptimisticMessageLocation | null => {
  for (let pageIndex = data.pages.length - 1; pageIndex >= 0; pageIndex--) {
    const messages = data.pages[pageIndex].messages;

    for (
      let messageIndex = messages.length - 1;
      messageIndex >= 0;
      messageIndex--
    ) {
      const message = messages[messageIndex];
      if (message.id >= 0) continue;

      if (clientMessageId) {
        if (message.clientMessageId === clientMessageId) {
          return { pageIndex, messageIndex };
        }
        continue;
      }

      return { pageIndex, messageIndex };
    }
  }

  return null;
};

/**
 * 낙관적 메시지를 실제 서버 응답 메시지로 교체합니다.
 * 짝이 되는 낙관적 메시지가 없으면 캐시 맨 앞에 새 메시지를 추가합니다.
 *
 * 상관 ID(`clientMessageId`)로 짝을 맞추므로, 다른 탭이나 기기에서 보낸
 * 내 메시지가 도착해도 이 탭의 전송 중인 메시지를 잘못 교체하지 않습니다.
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

      // 이미 반영된 메시지면 중복으로 넣지 않습니다.
      // (전송 타임아웃 처리 후 서버 응답이 뒤늦게 도착하는 경우 등)
      const alreadyExists = oldData.pages.some((page) =>
        page.messages.some((message) => message.id === newMessage.id),
      );
      if (alreadyExists) return oldData;

      const target = findOptimisticTarget(oldData, newMessage.clientMessageId);

      // 낙관적 메시지를 찾았으면 교체
      if (target) {
        const newPages = [...oldData.pages];
        const targetPage = { ...newPages[target.pageIndex] };
        const newMessages = [...targetPage.messages];
        newMessages[target.messageIndex] = newMessage;
        targetPage.messages = newMessages;
        newPages[target.pageIndex] = targetPage;
        return { ...oldData, pages: newPages };
      }

      // 짝이 없으면 맨 앞에 추가
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
