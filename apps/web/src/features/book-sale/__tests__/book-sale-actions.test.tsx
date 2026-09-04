import { SaleStatus, UsedBookSale } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookSaleActions } from "@/features/book-sale/components/sale-detail/book-sale-detail/book-sale-actions";

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

let mockCurrentUser: { id: number; nickname: string } | null = {
  id: 1,
  nickname: "판매자",
};

vi.mock("@/features/auth/stores/use-auth-store", () => ({
  useAuthStore: (selector: any) => selector({ user: mockCurrentUser }),
}));

vi.mock("@/shared/providers/socket-provider", () => ({
  useSocketContext: () => ({ socket: null, isConnected: true }),
}));

vi.mock("@/features/confirm", () => ({
  useConfirm: () => vi.fn(),
}));

vi.mock("@/features/chat/hooks/use-open-chat-room", () => ({
  useOpenChatRoom: () => vi.fn(),
}));

vi.mock("@/features/auth/components/email-verification-alert", () => ({
  EmailVerificationModal: () => null,
}));

vi.mock("@/features/user/components/wishlist/wishlist-button", () => ({
  WishlistButton: () => null,
}));

vi.mock("@/shared/components/magicui/cool-mode", () => ({
  CoolMode: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/features/book-sale/mutations", () => ({
  useDeleteBookSaleMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateBookSaleStatusMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@bookjeok/react-query", () => ({
  useCancelSaleReservationMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useSellerStatsQuery: () => ({
    data: {
      totalCompletedSales: 1,
      directCompletedSales: 1,
      deliveryCompletedSales: 0,
      totalReviews: 0,
      positiveReviews: 0,
      positiveRate: 0,
    },
    isLoading: false,
  }),
}));

const baseSale = {
  id: 10,
  title: "클린 코드",
  price: 15000,
  city: "서울",
  district: "강남구",
  content: "책 상태 좋습니다.",
  imageUrls: [],
  status: SaleStatus.FOR_SALE,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  user: {
    id: 1,
    handle: "seller_handle",
    nickname: "작은콩",
    profileImageUrl: null,
  },
  viewCount: 0,
  hasActiveOrder: false,
  hasTradeCompletion: false,
} as unknown as UsedBookSale;

const renderActions = (sale: UsedBookSale) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BookSaleActions sale={sale} />
    </QueryClientProvider>,
  );

describe("BookSaleActions UI 레이아웃 및 잠금 테스트", () => {
  beforeEach(() => {
    mockCurrentUser = { id: 1, nickname: "작은콩" };
  });

  it("판매자 프로필(닉네임, 판매자 뱃지, 신뢰 뱃지)이 올바르게 렌더링된다", () => {
    renderActions(baseSale);

    // 닉네임 링크
    const nicknameLink = screen.getByRole("link", { name: "작은콩" });
    expect(nicknameLink).toBeInTheDocument();
    expect(nicknameLink).toHaveAttribute("href", "/users/seller_handle");

    // 판매자 라벨
    expect(
      screen.getByText("market.detail.actions.seller"),
    ).toBeInTheDocument();

    // 신뢰 뱃지 (거래 완료 수)
    expect(
      screen.getByText("order.trade_review.stats.badge_trades_only"),
    ).toBeInTheDocument();
  });

  it("활성 주문이나 거래 완료가 없는 판매글의 수정 버튼은 링크로 동작한다", () => {
    renderActions({
      ...baseSale,
      hasActiveOrder: false,
      hasTradeCompletion: false,
    });

    const editLink = screen.getByRole("link", {
      name: /market.detail.actions.edit/i,
    });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute("href", "/my-page/sales/10/edit");
    expect(editLink).not.toBeDisabled();
  });

  it("거래 완료(hasTradeCompletion: true) 상태에서는 수정 버튼이 비활성화된다", () => {
    renderActions({
      ...baseSale,
      status: SaleStatus.SOLD,
      hasTradeCompletion: true,
    });

    const editBtn = screen.getByRole("button", {
      name: /market.detail.actions.edit/i,
    });
    expect(editBtn).toBeDisabled();
    expect(editBtn).toHaveAttribute(
      "title",
      "market.detail.actions.in_trade_cannot_modify",
    );
  });

  it("활성 주문(hasActiveOrder: true) 상태에서는 수정 버튼과 삭제 버튼이 비활성화된다", () => {
    renderActions({
      ...baseSale,
      hasActiveOrder: true,
    });

    const editBtn = screen.getByRole("button", {
      name: /market.detail.actions.edit/i,
    });
    const deleteBtn = screen.getByRole("button", {
      name: /market.detail.actions.delete/i,
    });

    expect(editBtn).toBeDisabled();
    expect(deleteBtn).toBeDisabled();
  });

  it("작성자가 아닌 사용자에게는 채팅 시작 버튼이 렌더링된다", () => {
    mockCurrentUser = { id: 999, nickname: "다른구매자" };

    renderActions(baseSale);

    expect(
      screen.getByRole("button", {
        name: /market.detail.actions.chat_start/i,
      }),
    ).toBeInTheDocument();
  });
});
