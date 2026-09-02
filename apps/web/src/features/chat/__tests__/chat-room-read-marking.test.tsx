/**
 * 읽음 처리 규칙 검증.
 * 위젯을 닫아도 ChatRoom이 마운트 상태로 남으므로, 안 보이는 동안 도착한 메시지가
 * 읽음 처리되지 않는지와 읽음 요청이 단일 경로로만 나가는지 확인한다.
 */
import { ChatMessage, ChatRoom as ChatRoomType } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
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

// 읽음 처리 이펙트만 검증하므로 무거운 자식 컴포넌트는 모킹
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

const mockEmit = vi.fn();
vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => ({
    socket: { connected: true, emit: mockEmit },
    isConnected: true,
  }),
}));

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: Object.assign(
    (selector: (state: unknown) => unknown) =>
      selector({
        user: { id: ME, handle: "me", nickname: "나", profileImageUrl: null },
      }),
    {
      getState: () => ({
        user: { id: ME, handle: "me", nickname: "나", profileImageUrl: null },
      }),
    },
  ),
}));

const message = (id: number, senderId: number): ChatMessage => ({
  id,
  content: `메시지 ${id}`,
  isRead: false,
  createdAt: new Date().toISOString(),
  sender: {
    id: senderId,
    handle: "u",
    nickname: "u",
    profileImageUrl: null,
  },
  chatRoom: { id: ROOM_ID },
});

const room = {
  id: ROOM_ID,
  createdAt: new Date().toISOString(),
  participants: [
    { user: { id: ME, handle: "me", nickname: "나", profileImageUrl: null } },
    { user: { id: YOU, handle: "you", nickname: "너", profileImageUrl: null } },
  ],
  usedBookSale: { id: 1, book: { title: "책" } },
} as unknown as ChatRoomType;

let currentMessages: ChatMessage[] = [];

vi.mock("@bookjeok/react-query", () => ({
  useMyChatRoomsQuery: (options?: {
    select?: (rooms: ChatRoomType[]) => unknown;
  }) => ({
    data: options?.select ? options.select([room]) : [room],
    isSuccess: true,
  }),
  useInfiniteChatMessagesQuery: () => ({
    // 서버는 최신이 먼저 오도록 DESC로 내려줍니다.
    data: {
      pages: [
        {
          messages: [...currentMessages].reverse(),
          opponentLastReadMessageId: null,
        },
      ],
      pageParams: [undefined],
    },
    fetchPreviousPage: vi.fn(),
    hasPreviousPage: false,
    isFetchingPreviousPage: false,
    isLoading: false,
  }),
  useMarkRoomAsReadMutation: () => ({ mutate: vi.fn() }),
  useActiveOrderByRoomQuery: () => ({ data: undefined, isLoading: false }),
}));

import { ChatRoom } from "@/features/chat/components/room/chat-room";

const markAsReadCalls = () =>
  mockEmit.mock.calls.filter((call) => call[0] === "markAsRead");

let queryClient: QueryClient;

const renderRoom = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <ChatRoom roomId={ROOM_ID} />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  currentMessages = [message(10, YOU)];
  useChatStore.setState({
    isChatOpen: false,
    activeChatRoomId: ROOM_ID,
    opponentLastReadMessageId: {},
  });
});

describe("ChatRoom 읽음 처리", () => {
  it("위젯이 닫혀 있으면 읽음 처리를 보내지 않는다", () => {
    renderRoom();

    expect(markAsReadCalls()).toHaveLength(0);
  });

  it("위젯이 열리면 그때 한 번 보낸다", () => {
    const { rerender } = renderRoom();

    act(() => {
      useChatStore.setState({ isChatOpen: true });
    });

    expect(markAsReadCalls()).toHaveLength(1);
    expect(markAsReadCalls()[0][1]).toEqual({ roomId: ROOM_ID });

    // 같은 지점에서 다시 렌더링해도 중복 요청하지 않는다
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatRoom roomId={ROOM_ID} />
      </QueryClientProvider>,
    );
    expect(markAsReadCalls()).toHaveLength(1);
  });

  it("내가 보낸 메시지는 읽음 처리를 유발하지 않는다", () => {
    const { rerender } = renderRoom();
    act(() => {
      useChatStore.setState({ isChatOpen: true });
    });
    expect(markAsReadCalls()).toHaveLength(1);

    currentMessages = [...currentMessages, message(11, ME)];
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatRoom roomId={ROOM_ID} />
      </QueryClientProvider>,
    );

    expect(markAsReadCalls()).toHaveLength(1);
  });

  it("보고 있는 동안 상대 메시지가 오면 다시 보낸다", () => {
    const { rerender } = renderRoom();
    act(() => {
      useChatStore.setState({ isChatOpen: true });
    });

    currentMessages = [...currentMessages, message(12, YOU)];
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatRoom roomId={ROOM_ID} />
      </QueryClientProvider>,
    );

    expect(markAsReadCalls()).toHaveLength(2);
  });

  it("닫혀 있는 동안 온 메시지는 다시 열 때 한 번에 처리한다", () => {
    const { rerender } = renderRoom();

    // 닫힌 채로 상대 메시지가 두 건 도착
    currentMessages = [...currentMessages, message(12, YOU), message(13, YOU)];
    rerender(
      <QueryClientProvider client={queryClient}>
        <ChatRoom roomId={ROOM_ID} />
      </QueryClientProvider>,
    );
    expect(markAsReadCalls()).toHaveLength(0);

    act(() => {
      useChatStore.setState({ isChatOpen: true });
    });
    expect(markAsReadCalls()).toHaveLength(1);
  });
});
