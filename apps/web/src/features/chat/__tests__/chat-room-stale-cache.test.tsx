/**
 * 앱을 백그라운드에 두었다 돌아왔을 때 방 안의 메시지가 비는 문제 검증.
 *
 * 실제 증상(iOS 사파리): 웹을 숨겼다가 돌아오면 방 목록에는 새 메시지가 왔다고
 * 표시되는데, 그 방에 들어가면 메시지가 없습니다. 새로고침해야 보입니다.
 *
 * 원인: 방 목록 쿼리는 refetchOnWindowFocus가 켜져 있어 복귀 시 갱신되지만,
 * 메시지 쿼리는 refetchOnWindowFocus가 꺼져 있고 staleTime이 무한이라
 * 스스로 다시 받아오지 않습니다. 소켓이 끊긴 동안 온 메시지는 영영 비어 있습니다.
 *
 * 재연결 시 동기화는 소켓 connect 이벤트에만 걸려 있어, 소켓이 끊긴 줄 모르거나
 * 재연결이 늦으면 이 경로로는 낫지 않습니다. 그래서 방 목록이 알고 있는
 * 마지막 메시지보다 방 캐시가 뒤처져 있으면 스스로 메꾸도록 합니다.
 */
import { chatKeys, ChatMessage, ChatRoom as ChatRoomType } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatStore } from "@/features/chat/stores/use-chat-store";

const ROOM_ID = 7;
const ME = 1;
const YOU = 2;

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));
vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));
vi.mock("@/features/confirm", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@/features/chat/components/room/chat-room/header", () => ({
  ChatRoomHeader: () => null,
}));
vi.mock("@/features/chat/components/room/chat-room/input", () => ({
  ChatInput: () => null,
}));
vi.mock("@/features/chat/components/room/chat-room/message-list", () => ({
  MessageList: () => null,
}));
vi.mock("@/features/chat/components/trade/trade-status-banner", () => ({
  TradeStatusBanner: () => null,
}));

vi.mock("@/shared/providers/socket-provider", () => ({
  // 소켓은 살아 있다고 보고하지만 실제로는 메시지를 놓친 상태(좀비 소켓)를 흉내 냅니다.
  // connect 이벤트는 발생하지 않습니다.
  useSocketContext: () => ({
    socket: { connected: true, emit: vi.fn() },
    isConnected: true,
  }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({ user: { id: ME, handle: "me", nickname: "나" } }),
    { getState: () => ({ user: { id: ME, handle: "me", nickname: "나" } }) },
  ),
}));

const message = (id: number, senderId: number): ChatMessage => ({
  id,
  content: `메시지 ${id}`,
  isRead: false,
  createdAt: new Date(2026, 0, 1, 0, 0, id).toISOString(),
  sender: { id: senderId, handle: "u", nickname: "u", profileImageUrl: null },
  chatRoom: { id: ROOM_ID },
});

/** 방 캐시에 들어 있는 메시지(백그라운드 전까지 받은 것) */
const CACHED_NEWEST_ID = 100;
/** 백그라운드 동안 도착해 목록 쿼리만 알고 있는 메시지 */
const MISSED_MESSAGE_ID = 200;

const room = {
  id: ROOM_ID,
  createdAt: new Date().toISOString(),
  participants: [
    { user: { id: ME, handle: "me", nickname: "나", profileImageUrl: null } },
    { user: { id: YOU, handle: "you", nickname: "너", profileImageUrl: null } },
  ],
  usedBookSale: { id: 1, book: { title: "책" } },
  // 복귀 시 목록 쿼리가 새로 받아온 값
  lastMessage: message(MISSED_MESSAGE_ID, YOU),
  unreadCount: 1,
} as unknown as ChatRoomType;

let queryClient: QueryClient;

vi.mock("@bookjeok/react-query", () => ({
  useMyChatRoomsQuery: (options?: {
    select?: (rooms: ChatRoomType[]) => unknown;
  }) => ({
    data: options?.select ? options.select([room]) : [room],
    isSuccess: true,
  }),
  // 실제 캐시를 그대로 읽어 화면에 쓰이는 데이터를 흉내 냅니다.
  useInfiniteChatMessagesQuery: () => ({
    data: queryClient.getQueryData(chatKeys.messages(ROOM_ID).queryKey),
    fetchPreviousPage: vi.fn(),
    hasPreviousPage: true,
    isFetchingPreviousPage: false,
    isLoading: false,
  }),
  useMarkRoomAsReadMutation: () => ({ mutate: vi.fn() }),
  useActiveOrderByRoomQuery: () => ({ data: undefined, isLoading: false }),
}));

import { ChatRoom } from "@/features/chat/components/room/chat-room";

const messagesKey = chatKeys.messages(ROOM_ID).queryKey;

const getCache = () =>
  queryClient.getQueryData<{
    pages: { messages: ChatMessage[] }[];
    pageParams: (number | undefined)[];
  }>(messagesKey);

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // 과거 페이지를 한 번 불러온 상태.
  // pages[0]이 오래된 페이지, 마지막이 커서 없는 첫 페이지입니다.
  queryClient.setQueryData(messagesKey, {
    pages: [
      { messages: [message(50, YOU), message(40, YOU)] },
      { messages: [message(CACHED_NEWEST_ID, YOU), message(90, ME)] },
    ],
    pageParams: [60, undefined],
  });

  useChatStore.setState({
    isChatOpen: true,
    activeChatRoomId: ROOM_ID,
    opponentLastReadMessageId: {},
  });
});

const renderRoom = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <ChatRoom roomId={ROOM_ID} />
    </QueryClientProvider>,
  );

describe("방 캐시가 목록보다 뒤처졌을 때", () => {
  it("목록이 아는 마지막 메시지가 방 캐시에 없으면 다시 받아온다", () => {
    renderRoom();

    // 커서 없는 첫 페이지만 남겨야 새 메시지까지 이어서 받아올 수 있습니다.
    // 과거 페이지를 커서 그대로 다시 받으면 사이에 구간이 비어 버립니다.
    expect(getCache()?.pages).toHaveLength(1);
    expect(getCache()?.pageParams).toEqual([undefined]);

    expect(queryClient.getQueryState(messagesKey)?.isInvalidated).toBe(true);
  });

  it("뒤처지지 않았으면 캐시를 건드리지 않는다", () => {
    // 목록의 마지막 메시지가 이미 방 캐시에 들어 있는 정상 상태
    room.lastMessage = message(CACHED_NEWEST_ID, YOU);

    renderRoom();

    expect(getCache()?.pages).toHaveLength(2);
    expect(queryClient.getQueryState(messagesKey)?.isInvalidated).toBe(false);

    room.lastMessage = message(MISSED_MESSAGE_ID, YOU);
  });
});
