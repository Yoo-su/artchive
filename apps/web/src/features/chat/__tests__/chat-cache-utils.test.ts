/**
 * 메시지 캐시 정합성 검증.
 *
 * 낙관적 메시지 교체는 상관 ID(clientMessageId)로 짝을 맞춥니다.
 * 다른 탭/기기에서 보낸 내 메시지가 도착해도 이 탭의 전송 중인 메시지를
 * 잘못 교체하지 않는지가 핵심입니다.
 */
import { chatKeys, ChatMessage } from "@bookjeok/core";
import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it } from "vitest";

import {
  prependMessageToCache,
  replaceOptimisticMessage,
  setMessageSendState,
} from "@/features/chat/utils/chat-cache-utils";

const ROOM_ID = 7;

type MessagesCache = {
  pages: { messages: ChatMessage[] }[];
  pageParams: (number | undefined)[];
};

const createMessage = (
  id: number,
  content: string,
  clientMessageId?: string,
): ChatMessage => ({
  id,
  content,
  isRead: false,
  clientMessageId,
  createdAt: new Date().toISOString(),
  sender: { id: 1, handle: "me", nickname: "나", profileImageUrl: null },
  chatRoom: { id: ROOM_ID },
});

let queryClient: QueryClient;

const seedPages = (pages: ChatMessage[][]) => {
  queryClient.setQueryData<MessagesCache>(chatKeys.messages(ROOM_ID).queryKey, {
    pages: pages.map((messages) => ({ messages })),
    pageParams: pages.map((_, index) => (index === pages.length - 1 ? undefined : index)),
  });
};

const seedCache = (messages: ChatMessage[]) => {
  queryClient.setQueryData<MessagesCache>(chatKeys.messages(ROOM_ID).queryKey, {
    pages: [{ messages }],
    pageParams: [undefined],
  });
};

const getMessages = () =>
  queryClient
    .getQueryData<MessagesCache>(chatKeys.messages(ROOM_ID).queryKey)!
    .pages.flatMap((page) => page.messages);

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

describe("replaceOptimisticMessage", () => {
  it("상관 ID가 일치하는 낙관적 메시지를 교체한다", () => {
    seedCache([
      createMessage(-2, "두 번째", "cid-2"),
      createMessage(-1, "첫 번째", "cid-1"),
    ]);

    replaceOptimisticMessage(
      queryClient,
      ROOM_ID,
      createMessage(100, "두 번째", "cid-2"),
    );

    const messages = getMessages();
    expect(messages.map((m) => m.id)).toEqual([100, -1]);
    // 짝이 아닌 낙관적 메시지는 그대로 남는다
    expect(messages[1].clientMessageId).toBe("cid-1");
  });

  it("다른 탭에서 보낸 내 메시지는 전송 중인 메시지를 건드리지 않는다", () => {
    seedCache([createMessage(-1, "이 탭에서 전송 중", "cid-mine")]);

    replaceOptimisticMessage(
      queryClient,
      ROOM_ID,
      createMessage(200, "다른 탭에서 보냄", "cid-other-tab"),
    );

    const messages = getMessages();
    // 교체가 아니라 앞에 추가되어야 한다
    expect(messages.map((m) => m.id)).toEqual([200, -1]);
    expect(messages[1].content).toBe("이 탭에서 전송 중");
  });

  it("상관 ID가 없으면(구버전 서버) 가장 오래된 낙관적 메시지를 교체한다", () => {
    seedCache([
      createMessage(-2, "나중", "cid-2"),
      createMessage(-1, "먼저", "cid-1"),
    ]);

    replaceOptimisticMessage(queryClient, ROOM_ID, createMessage(300, "먼저"));

    const messages = getMessages();
    expect(messages.map((m) => m.id)).toEqual([-2, 300]);
  });

  it("이미 반영된 메시지는 중복으로 추가하지 않는다", () => {
    seedCache([createMessage(400, "이미 도착함", "cid-1")]);

    replaceOptimisticMessage(
      queryClient,
      ROOM_ID,
      createMessage(400, "이미 도착함", "cid-1"),
    );

    expect(getMessages()).toHaveLength(1);
  });

  it("낙관적 메시지가 없으면 맨 앞에 추가한다", () => {
    seedCache([createMessage(10, "기존 메시지")]);

    replaceOptimisticMessage(
      queryClient,
      ROOM_ID,
      createMessage(500, "새 메시지", "cid-1"),
    );

    expect(getMessages().map((m) => m.id)).toEqual([500, 10]);
  });
});

/**
 * 과거 메시지를 불러오면 TanStack이 새 페이지를 배열 **앞**에 붙입니다.
 * 그래서 `pages[0]`은 가장 오래된 페이지가 되고, 새 메시지는 마지막 페이지에
 * 들어가야 시간순이 유지됩니다.
 */
describe("페이지가 여러 개일 때", () => {
  it("새 메시지를 가장 오래된 페이지가 아니라 최신 페이지에 넣는다", () => {
    seedPages([
      [createMessage(2, "과거2"), createMessage(1, "과거1")],
      [createMessage(20, "최신20"), createMessage(10, "최신10")],
    ]);

    prependMessageToCache(queryClient, ROOM_ID, createMessage(30, "새 메시지"));

    const cache = queryClient.getQueryData<MessagesCache>(
      chatKeys.messages(ROOM_ID).queryKey,
    )!;
    expect(cache.pages[0].messages.map((m) => m.id)).toEqual([2, 1]);
    expect(cache.pages[1].messages.map((m) => m.id)).toEqual([30, 20, 10]);
  });

  it("짝 없는 서버 메시지도 최신 페이지에 붙인다", () => {
    seedPages([
      [createMessage(2, "과거2")],
      [createMessage(20, "최신20")],
    ]);

    replaceOptimisticMessage(
      queryClient,
      ROOM_ID,
      createMessage(30, "다른 탭", "cid-other"),
    );

    const cache = queryClient.getQueryData<MessagesCache>(
      chatKeys.messages(ROOM_ID).queryKey,
    )!;
    expect(cache.pages[1].messages.map((m) => m.id)).toEqual([30, 20]);
  });
});

describe("setMessageSendState", () => {
  it("상관 ID가 같은 낙관적 메시지의 상태만 바꾼다", () => {
    seedCache([
      createMessage(-2, "두 번째", "cid-2"),
      createMessage(-1, "첫 번째", "cid-1"),
    ]);

    setMessageSendState(queryClient, ROOM_ID, "cid-1", "failed");

    const messages = getMessages();
    expect(messages.find((m) => m.clientMessageId === "cid-1")?.sendState).toBe(
      "failed",
    );
    expect(
      messages.find((m) => m.clientMessageId === "cid-2")?.sendState,
    ).toBeUndefined();
  });

  it("이미 확정된 메시지는 건드리지 않는다", () => {
    seedCache([createMessage(100, "확정됨", "cid-1")]);

    setMessageSendState(queryClient, ROOM_ID, "cid-1", "failed");

    expect(getMessages()[0].sendState).toBeUndefined();
  });
});
