/**
 * 위젯이 닫힌 동안 주문 폴링이 멈추는지 검증.
 * 위젯이 언마운트되지 않으므로 `useActiveOrderByRoomQuery`의 5초 폴링이
 * 닫힌 상태에서도 계속 도는지 확인한다.
 */
import { ChatRoom, SaleAuthor, SaleStatus, TradeMethod } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatStore } from "@/features/chat/stores/use-chat-store";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));
vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));
vi.mock("@/features/confirm", () => ({ useConfirm: () => vi.fn() }));

const activeOrderQuery = vi.fn(
  (_roomId?: number, _options?: { enabled?: boolean }) => ({
    data: undefined,
    isLoading: false,
  }),
);
vi.mock("@bookjeok/react-query", () => ({
  useActiveOrderByRoomQuery: (
    roomId?: number,
    options?: { enabled?: boolean },
  ) => activeOrderQuery(roomId, options),
  useCancelSelectionMutation: () => ({ mutate: vi.fn() }),
  useConfirmPurchaseMutation: () => ({ mutate: vi.fn() }),
}));

import { TradeStatusBanner } from "@/features/chat/components/trade/trade-status-banner";

const seller: SaleAuthor = {
  id: 1,
  nickname: "판매자",
  handle: "seller",
  profileImageUrl: null,
};
const buyer: SaleAuthor = {
  id: 2,
  nickname: "구매자",
  handle: "buyer",
  profileImageUrl: null,
};

const room = {
  id: 10,
  createdAt: "2026-08-27T00:00:00.000Z",
  participants: [{ user: seller }, { user: buyer }],
  usedBookSale: {
    id: 100,
    title: "클린 코드",
    price: 25000,
    status: SaleStatus.FOR_SALE,
    tradeMethod: TradeMethod.BOTH,
    user: seller,
    book: { title: "Clean Code" },
  },
} as unknown as ChatRoom;

/** 마지막 렌더링에서 쿼리에 넘어간 enabled 값 */
const lastEnabled = () => {
  const calls = activeOrderQuery.mock.calls;
  return calls[calls.length - 1][1]?.enabled;
};

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({ isChatOpen: false, activeChatRoomId: room.id });
});

describe("숨겨진 위젯의 주문 폴링", () => {
  it("닫혀 있는 동안에는 주문 쿼리를 돌리지 않는다", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TradeStatusBanner room={room} currentUser={buyer} opponent={seller} />
      </QueryClientProvider>,
    );

    expect(lastEnabled()).toBe(false);

    act(() => {
      useChatStore.setState({ isChatOpen: true });
    });

    // 열려 있을 때만 폴링 (결제 기능이 꺼져 있으면 항상 false)
    const expected = process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";
    expect(lastEnabled()).toBe(expected);
  });
});
