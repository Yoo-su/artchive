import {
  chatKeys,
  ChatMessage,
  ChatMessageSendState,
  ChatRoom,
} from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";

type InfiniteMessagesData = {
  pages: { messages: ChatMessage[] }[];
  pageParams: (number | undefined)[];
};

/**
 * 채팅 메시지 캐시 조작 유틸리티
 *
 * 페이지 순서: `fetchPreviousPage`로 불러온 과거 페이지가 배열 앞에 붙으므로
 * `pages[0]`이 가장 오래된 페이지, 마지막이 가장 최신 페이지입니다.
 * 각 페이지 안에서는 서버가 DESC로 내려주어 최신 메시지가 먼저 옵니다.
 * 따라서 새 메시지는 최신 페이지 맨 앞에 넣어야 시간순이 유지됩니다.
 */

/** 가장 최신 메시지가 들어 있는 페이지의 인덱스 */
const getNewestPageIndex = (data: InfiniteMessagesData) => data.pages.length - 1;

/** 최신 페이지 맨 앞에 메시지를 끼워 넣은 새 pages 배열 생성 */
const insertAsNewest = (
  data: InfiniteMessagesData,
  message: ChatMessage,
): InfiniteMessagesData["pages"] => {
  const newestIndex = getNewestPageIndex(data);
  const newPages = [...data.pages];
  newPages[newestIndex] = {
    ...newPages[newestIndex],
    messages: [message, ...newPages[newestIndex].messages],
  };
  return newPages;
};

/** 메시지를 특정 채팅방 메시지 캐시의 가장 최신 위치에 추가합니다. */
export const prependMessageToCache = (
  queryClient: QueryClient,
  roomId: number,
  message: ChatMessage,
) => {
  queryClient.setQueryData<InfiniteMessagesData>(
    chatKeys.messages(roomId).queryKey,
    (oldData) => {
      if (!oldData || oldData.pages.length === 0) return oldData;
      return { ...oldData, pages: insertAsNewest(oldData, message) };
    },
  );
};

/**
 * 특정 메시지를 캐시에서 제거합니다.
 * 실패한 낙관적 메시지를 사용자가 직접 지울 때 사용합니다.
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

/**
 * 낙관적 메시지의 전송 상태를 변경합니다.
 * 실패해도 메시지를 지우지 않고 실패 상태로 남겨 재전송/삭제를 허용합니다.
 */
export const setMessageSendState = (
  queryClient: QueryClient,
  roomId: number,
  clientMessageId: string,
  sendState: ChatMessageSendState,
) => {
  queryClient.setQueryData<InfiniteMessagesData>(
    chatKeys.messages(roomId).queryKey,
    (oldData) => {
      if (!oldData) return oldData;

      let changed = false;
      const newPages = oldData.pages.map((page) => {
        const index = page.messages.findIndex(
          (message) =>
            message.id < 0 && message.clientMessageId === clientMessageId,
        );
        if (index === -1) return page;

        changed = true;
        const messages = [...page.messages];
        messages[index] = { ...messages[index], sendState };
        return { ...page, messages };
      });

      return changed ? { ...oldData, pages: newPages } : oldData;
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
 * 상관 ID가 있으면 일치하는 메시지만, 없으면(구버전 서버) 가장 오래된 낙관적 메시지를 대상으로 합니다.
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
 * 짝이 없으면 캐시의 가장 최신 위치에 추가합니다.
 * 상관 ID(`clientMessageId`)로 짝을 맞춰 다른 탭/기기의 메시지가 잘못 교체되는 것을 방지합니다.
 */
export const replaceOptimisticMessage = (
  queryClient: QueryClient,
  roomId: number,
  newMessage: ChatMessage,
): void => {
  queryClient.setQueryData<InfiniteMessagesData>(
    chatKeys.messages(roomId).queryKey,
    (oldData) => {
      if (!oldData || oldData.pages.length === 0) return oldData;

      // 중복 반영 방지 (전송 타임아웃 처리 후 서버 응답이 뒤늦게 도착하는 경우 등)
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

      // 짝이 없으면 가장 최신 위치에 추가
      return { ...oldData, pages: insertAsNewest(oldData, newMessage) };
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

/**
 * 방의 메시지 캐시를 첫 페이지만 남기고 다시 받아오게 합니다.
 * 연결이 끊긴 동안 놓친 메시지를 메꿀 때 사용합니다.
 *
 * 과거 페이지는 커서가 고정되어 있어 그대로 다시 받으면 페이지 사이에 빈 구간이 생기므로,
 * 커서 없는 첫 페이지만 남겨 최신부터 이어 받습니다. 화면이 비지 않도록 캐시는 지우지 않습니다.
 */
export const resyncRoomMessages = (
  queryClient: QueryClient,
  roomId: number,
): void => {
  const queryKey = chatKeys.messages(roomId).queryKey;

  queryClient.setQueryData<InfiniteMessagesData>(queryKey, (oldData) => {
    if (!oldData || oldData.pages.length <= 1) return oldData;
    return {
      ...oldData,
      pages: oldData.pages.slice(-1),
      pageParams: oldData.pageParams.slice(-1),
    };
  });

  queryClient.invalidateQueries({ queryKey });
};

/**
 * 채팅방 목록 캐시에서 해당 방의 안 읽음 배지를 즉시 0으로 만듭니다.
 * 서버 요청 없이 화면만 먼저 반영하는 낙관적 업데이트입니다.
 */
export const markRoomReadInCache = (
  queryClient: QueryClient,
  roomId: number,
): void => {
  queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms.queryKey, (oldRooms) => {
    if (!oldRooms) return oldRooms;
    // 이미 0이면 배열 참조를 유지해 불필요한 리렌더 방지
    if (!oldRooms.some((room) => room.id === roomId && room.unreadCount)) {
      return oldRooms;
    }
    return oldRooms.map((room) =>
      room.id === roomId ? { ...room, unreadCount: 0 } : room,
    );
  });
};
