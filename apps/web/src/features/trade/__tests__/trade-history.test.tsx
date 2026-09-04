import {
  TradeCompletion,
  TradeCompletionMethod,
  TradeReviewTag,
} from "@bookjeok/core";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TradeHistoryCard } from "../components/history/trade-history-card";

const mockUpdateTradeReviewMutate = vi.fn();
const mockCreateTradeReviewMutate = vi.fn();

vi.mock("@bookjeok/react-query", () => ({
  useCreateTradeReviewMutation: (options?: any) => ({
    mutate: (args: any) => {
      mockCreateTradeReviewMutate(args);
      options?.onSuccess?.(args);
    },
    isPending: false,
  }),
  useUpdateTradeReviewMutation: (options?: any) => ({
    mutate: (args: any) => {
      mockUpdateTradeReviewMutate(args);
      options?.onSuccess?.(args);
    },
    isPending: false,
  }),
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ href, children, ...props }: any) => (
    <a href={typeof href === "string" ? href : href?.pathname} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (namespace: string) => (key: string) => {
    const map: Record<string, string> = {
      btn_write_review: "후기 남기기",
      btn_edit_review: "수정",
      review_written: "후기 작성 완료",
      review_expired: "후기 기간 종료",
      method_direct: "직거래",
      method_delivery: "안전결제",
      role_buyer: "구매",
      role_seller: "판매",
      counterparty_seller: "판매자",
      counterparty_buyer: "구매자",
      modal_title: "거래 후기 작성",
      modal_title_edit: "거래 후기 수정",
      submit: "후기 등록하기",
      submit_edit: "후기 수정하기",
      "tags.KIND_MANNER": "친절하고 매너가 좋아요",
      "tags.GOOD_CONDITION": "책 상태가 설명과 같아요",
    };
    return map[key] ?? `${namespace}.${key}`;
  },
}));

const DAY = 24 * 60 * 60 * 1000;

const completion = (overrides?: Partial<TradeCompletion>): TradeCompletion =>
  ({
    id: 1,
    saleId: 100,
    sellerId: 1,
    buyerId: 2,
    chatRoomId: 5,
    method: TradeCompletionMethod.DIRECT,
    orderId: null,
    completedAt: new Date(Date.now() - 2 * DAY).toISOString(),
    createdAt: new Date(Date.now() - 2 * DAY).toISOString(),
    updatedAt: new Date(Date.now() - 2 * DAY).toISOString(),
    myRole: "BUYER",
    counterparty: {
      id: 1,
      handle: "seller",
      nickname: "판매자",
      profileImageUrl: null,
    },
    myReview: null,
    canWriteReview: true,
    reviewExpiresAt: new Date(Date.now() + 12 * DAY).toISOString(),
    sale: {
      id: 100,
      title: "클린 코드",
      price: 15000,
      imageUrls: [],
    } as never,
    ...overrides,
  }) as TradeCompletion;

describe("TradeHistoryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("후기를 아직 안 썼으면 작성 버튼을 보여준다", () => {
    render(<TradeHistoryCard completion={completion()} />);

    expect(screen.getByText("후기 남기기")).toBeInTheDocument();
  });

  it("이미 쓴 후기는 기한 내라면 수정할 수 있다", () => {
    render(
      <TradeHistoryCard
        completion={completion({
          canWriteReview: false,
          myReview: {
            id: 9,
            completionId: 1,
            reviewerId: 2,
            targetUserId: 1,
            tags: [TradeReviewTag.KIND_MANNER],
            content: "좋았어요",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })}
      />,
    );

    expect(screen.getByText("후기 작성 완료")).toBeInTheDocument();
    expect(screen.getByText("수정")).toBeInTheDocument();
  });

  it("작성 기한이 지나면 수정 버튼도 숨긴다", () => {
    // 후기는 삭제할 수 없고 14일 이내에만 고칠 수 있다.
    render(
      <TradeHistoryCard
        completion={completion({
          canWriteReview: false,
          reviewExpiresAt: new Date(Date.now() - 1 * DAY).toISOString(),
          myReview: {
            id: 9,
            completionId: 1,
            reviewerId: 2,
            targetUserId: 1,
            tags: [TradeReviewTag.KIND_MANNER],
            content: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })}
      />,
    );

    expect(screen.getByText("후기 작성 완료")).toBeInTheDocument();
    expect(screen.queryByText("수정")).not.toBeInTheDocument();
  });

  it("후기도 없고 기한도 지났으면 종료 안내만 남는다", () => {
    render(
      <TradeHistoryCard
        completion={completion({ canWriteReview: false, myReview: null })}
      />,
    );

    expect(screen.getByText("후기 기간 종료")).toBeInTheDocument();
    expect(screen.queryByText("후기 남기기")).not.toBeInTheDocument();
  });

  it("수정 버튼을 누르면 기존 내용이 채워진 수정 모달이 열린다", () => {
    render(
      <TradeHistoryCard
        completion={completion({
          canWriteReview: false,
          myReview: {
            id: 9,
            completionId: 1,
            reviewerId: 2,
            targetUserId: 1,
            tags: [TradeReviewTag.KIND_MANNER],
            content: "좋았어요",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        })}
      />,
    );

    fireEvent.click(screen.getByText("수정"));

    expect(screen.getByText("거래 후기 수정")).toBeInTheDocument();
    expect(screen.getByDisplayValue("좋았어요")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "후기 수정하기" }));

    expect(mockUpdateTradeReviewMutate).toHaveBeenCalledWith({
      reviewId: 9,
      payload: {
        tags: [TradeReviewTag.KIND_MANNER],
        content: "좋았어요",
      },
    });
    expect(mockCreateTradeReviewMutate).not.toHaveBeenCalled();
  });
});
