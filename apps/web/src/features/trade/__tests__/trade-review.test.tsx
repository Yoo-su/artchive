import {
  SellerTradeStats,
  TradeCompletionMethod,
  TradeReview,
  TradeReviewTag,
} from "@bookjeok/core";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SellerStatsCard } from "../components/review/seller-stats-card";
import { SellerTrustBadge } from "../components/review/seller-trust-badge";
import { TradeReviewCard } from "../components/review/trade-review-card";
import { TradeReviewModal } from "../components/review/trade-review-modal";
import { UserTradeReviewsList } from "../components/review/user-trade-reviews-list";

const mockCreateTradeReviewMutate = vi.fn();
let mockSellerStatsData: SellerTradeStats | null = null;
let mockTradeReviewsData: { reviews: TradeReview[]; total: number } | null =
  null;
const mockIsStatsLoading = false;
const mockIsReviewsLoading = false;

vi.mock("@bookjeok/react-query", () => ({
  useCreateTradeReviewMutation: (options?: any) => ({
    mutate: (args: any) => {
      mockCreateTradeReviewMutate(args);
      options?.onSuccess?.({ id: 1, ...args });
    },
    isPending: false,
  }),
  useUpdateTradeReviewMutation: (options?: any) => ({
    mutate: (args: any) => options?.onSuccess?.(args),
    isPending: false,
  }),
  useSellerStatsQuery: () => ({
    data: mockSellerStatsData,
    isLoading: mockIsStatsLoading,
  }),
  useUserTradeReviewsQuery: () => ({
    data: mockTradeReviewsData,
    isLoading: mockIsReviewsLoading,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (namespace: string) => (key: string, values?: any) => {
    const map: Record<string, string> = {
      modal_title: "거래 후기 작성",
      modal_desc: "솔직한 후기를 남겨주세요.",
      positive_tags_title: "어떤 점이 좋았나요?",
      negative_tags_title: "어떤 점이 아쉬웠나요?",
      "tags.GOOD_CONDITION": "책 상태가 설명과 같아요",
      "tags.FAST_RESPONSE": "응답이 빨라요",
      "tags.FAST_SHIPPING": "배송이 빨라요",
      "tags.METICULOUS_PACKAGING": "포장이 꼼꼼해요",
      "tags.KIND_MANNER": "친절하고 매너가 좋아요",
      "tags.BAD_CONDITION": "책 상태가 설명과 달라요",
      "tags.SLOW_RESPONSE": "응답이 느려요",
      "tags.LATE_SHIPPING": "배송이 늦었어요",
      "tags.POOR_PACKAGING": "포장이 부실해요",
      content_label: "상세 후기 (선택)",
      content_placeholder: "따뜻한 후기를 남겨주세요.",
      submit: "후기 등록하기",
      submitting: "등록 중...",
      success: "거래 후기가 성공적으로 등록되었습니다.",
      "errors.tag_required": "최소 1개 이상의 태그를 선택해주세요.",
      "errors.content_max": "후기는 500자 이하로 작성해주세요.",
      title:
        namespace === "order.trade_review.stats" ? "거래 신뢰도" : "거래 후기",
      "stats.title": "거래 신뢰도",
      positive_rate: `긍정 후기 ${values?.rate ?? 0}%`,
      "stats.positive_rate": `긍정 후기 ${values?.rate ?? 0}%`,
      tag_summary_title: "받은 평가 요약",
      "stats.tag_summary_title": "받은 평가 요약",
      no_reviews: "아직 등록된 거래 후기가 없습니다.",
      "stats.no_reviews": "아직 등록된 거래 후기가 없습니다.",
      badge_trust_direct: `직거래 ${values?.count ?? 0}건 · 만족도 ${values?.rate ?? 0}%`,
      badge_trust_split: `직거래 ${values?.direct ?? 0}건 · 안전결제 ${values?.delivery ?? 0}건 · 만족도 ${values?.rate ?? 0}%`,
      "list.title": "거래 후기",
      empty_title: "거래 후기가 없습니다",
      "list.empty_title": "거래 후기가 없습니다",
      empty_desc: "아직 작성된 거래 후기가 없습니다.",
      "list.empty_desc": "아직 작성된 거래 후기가 없습니다.",
    };
    return map[key] || key;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("TradeReviewModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tag selector and comment input", () => {
    render(
      <TradeReviewModal
        completionId={10}
        targetRole="SELLER"
        method={TradeCompletionMethod.DELIVERY}
        targetUserNickname="판매자A"
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("거래 후기 작성")).toBeInTheDocument();
    expect(screen.getByText("어떤 점이 좋았나요?")).toBeInTheDocument();
    expect(screen.getByText("어떤 점이 아쉬웠나요?")).toBeInTheDocument();
    expect(screen.getByText("책 상태가 설명과 같아요")).toBeInTheDocument();
    expect(screen.getByText("책 상태가 설명과 달라요")).toBeInTheDocument();
  });

  it("shows error when submitting without selecting any tag", () => {
    render(
      <TradeReviewModal
        completionId={10}
        targetRole="SELLER"
        method={TradeCompletionMethod.DELIVERY}
        targetUserNickname="판매자A"
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    const submitBtn = screen.getByRole("button", { name: "후기 등록하기" });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText("최소 1개 이상의 태그를 선택해주세요."),
    ).toBeInTheDocument();
    expect(mockCreateTradeReviewMutate).not.toHaveBeenCalled();
  });

  it("selects tags and submits review successfully", () => {
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <TradeReviewModal
        completionId={10}
        targetRole="SELLER"
        method={TradeCompletionMethod.DELIVERY}
        targetUserNickname="판매자A"
        open={true}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />,
    );

    // 긍정 태그 선택
    const goodConditionTag = screen.getByText("책 상태가 설명과 같아요");
    fireEvent.click(goodConditionTag);

    // 상세 후기 입력
    const textarea = screen.getByPlaceholderText("따뜻한 후기를 남겨주세요.");
    fireEvent.change(textarea, {
      target: { value: "책 포장도 완벽하고 빠르게 받았습니다!" },
    });

    const submitBtn = screen.getByRole("button", { name: "후기 등록하기" });
    fireEvent.click(submitBtn);

    expect(mockCreateTradeReviewMutate).toHaveBeenCalledWith({
      completionId: 10,
      tags: [TradeReviewTag.GOOD_CONDITION],
      content: "책 포장도 완벽하고 빠르게 받았습니다!",
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("SellerStatsCard", () => {
  it("renders seller trade stats with positive rate and tag counts", () => {
    const mockStats: SellerTradeStats = {
      totalCompletedSales: 15,
      directCompletedSales: 12,
      deliveryCompletedSales: 3,
      totalReviews: 12,
      positiveRate: 92,
      tagCounts: {
        [TradeReviewTag.GOOD_CONDITION]: 10,
        [TradeReviewTag.FAST_SHIPPING]: 8,
        [TradeReviewTag.FAST_RESPONSE]: 5,
        [TradeReviewTag.METICULOUS_PACKAGING]: 7,
        [TradeReviewTag.KIND_MANNER]: 6,
        [TradeReviewTag.BAD_CONDITION]: 1,
        [TradeReviewTag.SLOW_RESPONSE]: 0,
        [TradeReviewTag.LATE_SHIPPING]: 0,
        [TradeReviewTag.POOR_PACKAGING]: 0,
      },
    };

    render(<SellerStatsCard stats={mockStats} />);

    expect(screen.getByText("거래 신뢰도")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument(); // completed sales
    expect(screen.getByText("12")).toBeInTheDocument(); // total reviews
    expect(screen.getByText("92%")).toBeInTheDocument(); // positive rate
    expect(screen.getByText("책 상태가 설명과 같아요")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});

describe("SellerTrustBadge", () => {
  it("does not render when no trade stats exist", () => {
    mockSellerStatsData = {
      totalCompletedSales: 0,
      directCompletedSales: 0,
      deliveryCompletedSales: 0,
      totalReviews: 0,
      positiveRate: 100,
      tagCounts: {},
    };

    const { container } = render(<SellerTrustBadge handle="user1" />);
    expect(container.firstChild).toBeNull();
  });

  it("직거래와 안전결제 건수를 나눠서 표시한다", () => {
    // 직거래 완료는 판매자 자기신고라 에스크로 거래와 신뢰도가 다르다.
    // 합산만 보여주면 그 차이가 가려지므로 나눠서 노출한다.
    mockSellerStatsData = {
      totalCompletedSales: 8,
      directCompletedSales: 5,
      deliveryCompletedSales: 3,
      totalReviews: 6,
      positiveRate: 100,
      tagCounts: {},
    };

    render(<SellerTrustBadge handle="user1" />);
    expect(
      screen.getByText("직거래 5건 · 안전결제 3건 · 만족도 100%"),
    ).toBeInTheDocument();
  });

  it("직거래만 있으면 직거래 건수만 표시한다", () => {
    mockSellerStatsData = {
      totalCompletedSales: 5,
      directCompletedSales: 5,
      deliveryCompletedSales: 0,
      totalReviews: 4,
      positiveRate: 75,
      tagCounts: {},
    };

    render(<SellerTrustBadge handle="user1" />);
    expect(screen.getByText("직거래 5건 · 만족도 75%")).toBeInTheDocument();
  });
});

describe("TradeReviewCard", () => {
  it("renders trade review with reviewer, tags, and content", () => {
    const review: TradeReview = {
      id: 1,
      completionId: 1,
      reviewerId: 2,
      reviewer: {
        id: 2,
        handle: "buyer_handle",
        nickname: "열정독서가",
        profileImageUrl: null,
      },
      targetUserId: 1,
      tags: [TradeReviewTag.GOOD_CONDITION, TradeReviewTag.FAST_SHIPPING],
      content: "깨끗하게 잘 받았습니다. 감사합니다!",
      createdAt: "2026-08-20T10:00:00.000Z",
      updatedAt: "2026-08-20T10:00:00.000Z",
      completion: {
        id: 1,
        saleId: 1,
        sellerId: 1,
        buyerId: 2,
        chatRoomId: 1,
        method: TradeCompletionMethod.DELIVERY,
        orderId: "ORD-2026-0001",
        completedAt: "2026-08-20T10:00:00.000Z",
        createdAt: "2026-08-20T10:00:00.000Z",
        updatedAt: "2026-08-20T10:00:00.000Z",
        sale: {
          id: 1,
          title: "클린 코드",
          price: 15000,
          status: "SOLD" as any,
          tradeMethod: "DELIVERY_ONLY" as any,
          city: "서울",
          district: "강남구",
          imageUrls: [],
          content: "깨끗한 책",
          viewCount: 10,
          createdAt: "2026-08-15T00:00:00.000Z",
          updatedAt: "2026-08-15T00:00:00.000Z",
          book: {
            title: "클린 코드",
            author: "로버트 마틴",
            publisher: "인사이트",
            pubdate: "2013-12-24",
            isbn: "9788966260959",
            description: "소프트웨어 장인 정신",
            image: "https://example.com/clean-code.jpg",
            discount: "30000",
            link: "https://example.com/clean-code",
          },
          user: {
            id: 1,
            handle: "seller_handle",
            nickname: "판매자",
            profileImageUrl: null,
          },
        },
      },
    };

    render(<TradeReviewCard review={review} />);

    expect(screen.getByText("열정독서가")).toBeInTheDocument();
    expect(screen.getByText("책 상태가 설명과 같아요")).toBeInTheDocument();
    expect(screen.getByText("배송이 빨라요")).toBeInTheDocument();
    expect(
      screen.getByText("깨끗하게 잘 받았습니다. 감사합니다!"),
    ).toBeInTheDocument();
  });
});

describe("UserTradeReviewsList", () => {
  it("renders empty state when no reviews exist", () => {
    mockSellerStatsData = {
      totalCompletedSales: 0,
      directCompletedSales: 0,
      deliveryCompletedSales: 0,
      totalReviews: 0,
      positiveRate: 100,
      tagCounts: {},
    };
    mockTradeReviewsData = {
      reviews: [],
      total: 0,
    };

    render(<UserTradeReviewsList handle="user1" />);

    expect(screen.getByText("거래 후기가 없습니다")).toBeInTheDocument();
    expect(
      screen.getByText("아직 작성된 거래 후기가 없습니다."),
    ).toBeInTheDocument();
  });
});
