import {
  ChatMessage,
  ChatMessageType,
  ChatRoom,
  Order,
  orderKeys,
  OrderStatus,
  SaleAuthor,
  SaleStatus,
  TradeMethod,
} from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TradeMethodBadge } from "@/features/book-sale/components/common/trade-method-badge";
import { TradeMessageCard } from "@/features/chat/components/trade/trade-message-card";
import { TradeStatusBanner } from "@/features/chat/components/trade/trade-status-banner";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => {
    return (key: string, options?: Record<string, any>) => {
      if (options?.carrier && options?.trackingNumber) {
        return `${options.carrier} ${options.trackingNumber}`;
      }
      return `${section ? `${section}.` : ""}${key}`;
    };
  },
}));

vi.mock("@/features/confirm", () => ({
  useConfirm: () => vi.fn(),
}));

const mockSeller: SaleAuthor = {
  id: 1,
  nickname: "판매자",
  handle: "seller",
  profileImageUrl: null,
};

const mockBuyer: SaleAuthor = {
  id: 2,
  nickname: "구매자",
  handle: "buyer",
  profileImageUrl: null,
};

const mockRoom: ChatRoom = {
  id: 10,
  createdAt: "2026-08-27T00:00:00.000Z",
  participants: [{ user: mockSeller }, { user: mockBuyer }],
  usedBookSale: {
    id: 100,
    title: "클린 코드",
    price: 25000,
    city: "서울",
    district: "강남구",
    content: "책 상태 좋습니다.",
    imageUrls: ["https://example.com/book.jpg"],
    status: SaleStatus.FOR_SALE,
    tradeMethod: TradeMethod.BOTH,
    createdAt: "2026-08-27T00:00:00.000Z",
    updatedAt: "2026-08-27T00:00:00.000Z",
    user: mockSeller,
    book: {
      isbn: "9788966260959",
      title: "Clean Code",
      author: "로버트 C. 마틴",
      publisher: "인사이트",
      image: "https://example.com/book.jpg",
      description: "클린 코드 책",
      discount: "30000",
      pubdate: "2013-12-24",
      link: "https://example.com/book",
    },
    viewCount: 10,
  },
};

describe("Phase 7 - Trade UI Components", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQuery = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );

  describe("TradeMethodBadge", () => {
    it("DIRECT_ONLY 거래방식을 올바르게 표시한다", () => {
      render(<TradeMethodBadge tradeMethod={TradeMethod.DIRECT_ONLY} />);
      expect(
        screen.getByText("market.trade_method.DIRECT_ONLY"),
      ).toBeInTheDocument();
    });

    it("DELIVERY_ONLY 거래방식을 올바르게 표시한다", () => {
      render(<TradeMethodBadge tradeMethod={TradeMethod.DELIVERY_ONLY} />);
      expect(
        screen.getByText("market.trade_method.DELIVERY_ONLY"),
      ).toBeInTheDocument();
    });

    it("BOTH 거래방식을 올바르게 표시한다", () => {
      render(<TradeMethodBadge tradeMethod={TradeMethod.BOTH} />);
      expect(
        screen.getByText("market.trade_method.BOTH"),
      ).toBeInTheDocument();
    });
  });

  describe("TradeMessageCard", () => {
    it("AWAITING_PAYMENT 카드에 결제 요청 정보와 링크가 포함된다", () => {
      const message: ChatMessage = {
        id: 1,
        content: "판매자가 거래 상대로 선택했습니다. 결제를 진행해주세요.",
        isRead: true,
        type: ChatMessageType.TRADE_ACTION,
        metadata: {
          orderId: "ORD-50",
          status: OrderStatus.AWAITING_PAYMENT,
          amount: 25000,
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: { id: 10 },
      };

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockBuyer.id} />,
      );

      expect(
        screen.getByText("chat.trade.message_card.title.AWAITING_PAYMENT"),
      ).toBeInTheDocument();
      expect(screen.getByText(/25,000/)).toBeInTheDocument();
      expect(
        screen.getByText("chat.trade.message_card.btn_pay_now"),
      ).toBeInTheDocument();
    });

    it("SHIPPED 카드에 운송장 정보가 표시된다", () => {
      const message: ChatMessage = {
        id: 2,
        content: "판매자가 상품을 발송했습니다.",
        isRead: true,
        type: ChatMessageType.TRADE_STATUS,
        metadata: {
          orderId: "ORD-50",
          status: OrderStatus.SHIPPED,
          carrier: "CJ대한통운",
          trackingNumber: "1234567890",
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: { id: 10 },
      };

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockBuyer.id} />,
      );

      expect(
        screen.getByText("chat.trade.message_card.title.SHIPPED"),
      ).toBeInTheDocument();
      expect(screen.getByText("CJ대한통운 1234567890")).toBeInTheDocument();
    });

    it("취소되거나 만료된 주문의 결제 버튼 클릭 시 토스트를 표시한다", () => {
      const message: ChatMessage = {
        id: 3,
        content: "판매자가 회원님을 거래 상대로 지정했습니다.",
        isRead: true,
        type: ChatMessageType.TRADE_ACTION,
        metadata: {
          orderId: "ORD-100",
          status: OrderStatus.AWAITING_PAYMENT,
          amount: 25000,
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: { id: 10 },
      };

      // 주문이 이미 취소된 상태로 캐시 세팅
      queryClient.setQueryData(orderKeys.detail("ORD-100").queryKey, {
        id: "ORD-100",
        status: OrderStatus.CANCELLED,
        amount: 25000,
      });

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockBuyer.id} />,
      );

      const payButton = screen.getByText("chat.trade.message_card.btn_pay_now");
      expect(payButton).toBeInTheDocument();

      fireEvent.click(payButton);

      expect(toast.error).toHaveBeenCalledWith(
        "chat.trade.message_card.order_closed_toast",
      );
    });

    it("판매자에게는 AWAITING_PAYMENT 카드에서 결제하기 버튼이 숨겨지고 상세보기만 표시된다", () => {
      const message: ChatMessage = {
        id: 4,
        content: "구매자에게 결제를 요청했습니다.",
        isRead: true,
        type: ChatMessageType.TRADE_ACTION,
        metadata: {
          orderId: "ORD-200",
          status: OrderStatus.AWAITING_PAYMENT,
          amount: 18000,
        },
        createdAt: "2026-08-27T00:00:00.000Z",
        sender: null,
        chatRoom: {
          id: 10,
          usedBookSale: {
            id: 1,
            user: { id: mockSeller.id },
          } as any,
        },
      };

      queryClient.setQueryData(orderKeys.detail("ORD-200").queryKey, {
        id: "ORD-200",
        sellerId: mockSeller.id,
        buyerId: mockBuyer.id,
        status: OrderStatus.AWAITING_PAYMENT,
        amount: 18000,
      });

      renderWithQuery(
        <TradeMessageCard message={message} currentUserId={mockSeller.id} />,
      );

      // 판매자이므로 결제 버튼은 없고 주문 상세보기 버튼만 존재해야 함
      expect(
        screen.queryByText("chat.trade.message_card.btn_pay_now"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("chat.trade.message_card.btn_view_detail"),
      ).toBeInTheDocument();
    });
  });

  describe("TradeStatusBanner", () => {
    it("주문이 없고 판매자일 때 '구매자로 지정' 버튼을 렌더링한다", () => {
      renderWithQuery(
        <TradeStatusBanner
          room={mockRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.btn_select_buyer"),
      ).toBeInTheDocument();
    });

    it("직거래 전용 상품일 경우 직거래 안내 뱃지를 렌더링한다", () => {
      const directOnlyRoom: ChatRoom = {
        ...mockRoom,
        usedBookSale: {
          ...mockRoom.usedBookSale,
          tradeMethod: TradeMethod.DIRECT_ONLY,
        },
      };

      renderWithQuery(
        <TradeStatusBanner
          room={directOnlyRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.direct_only_hint"),
      ).toBeInTheDocument();
    });

    it("상대방이 채팅방을 나갔을 때 '상대방이 대화방을 나갔습니다' 안내를 렌더링한다", () => {
      const leftRoom: ChatRoom = {
        ...mockRoom,
        participants: [
          { user: mockSeller, isActive: true },
          { user: mockBuyer, isActive: false },
        ],
      };

      renderWithQuery(
        <TradeStatusBanner
          room={leftRoom}
          currentUser={mockSeller}
          opponent={mockBuyer}
        />,
      );

      expect(
        screen.getByText("chat.trade.status_banner.opponent_left_hint"),
      ).toBeInTheDocument();
    });
  });
});
