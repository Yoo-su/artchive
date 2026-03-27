import * as apis from "@bookjeok/api-client/review";
import { Review, ReviewReactionType } from "@bookjeok/core/review";
import { reviewKeys } from "@bookjeok/react-query/review";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToggleReviewReactionMutation } from "@/features/review/mutations";

vi.mock("@bookjeok/api-client/review", () => ({
  toggleReviewReaction: vi.fn(),
}));

const mockReviewId = 100;
const mockReview = {
  id: mockReviewId,
  isbn: "1234",
  title: "리뷰 제목",
  content: "리뷰 내용",
  rating: 5,
  isPublic: true,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  user: { id: 1, handle: "userA", nickname: "UserA", profileImageUrl: null },
  reactionCounts: {
    [ReviewReactionType.LIKE]: 10,
    [ReviewReactionType.INSIGHTFUL]: 5,
    [ReviewReactionType.SUPPORT]: 2,
  },
  commentCount: 0,
  tags: [],
  imageUrls: [],
  viewCount: 0,
} as unknown as Review;

describe("useToggleReviewReactionMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    // 초기 캐시 데이터 셋업 (리뷰 상세 정보 + 나의 이전 리액션)
    queryClient.setQueryData(
      reviewKeys.detail(mockReviewId).queryKey,
      mockReview,
    );
    queryClient.setQueryData(
      [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      null, // 초기엔 리액션을 한 적 없음
    );
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("새로운 리액션을 추가하면 해당 카운트가 1 증가하고 나의 리액션 캐시가 업데이트된다", async () => {
    let resolveApi!: (value: unknown) => void;
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    vi.mocked(apis.toggleReviewReaction).mockReturnValue(apiPromise as any);

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    result.current.mutate(ReviewReactionType.LIKE);

    await waitFor(() => {
      const reviewCache = queryClient.getQueryData<Review>(
        reviewKeys.detail(mockReviewId).queryKey,
      );
      // 기존 10에서 11로 증가해야 함
      expect(reviewCache?.reactionCounts?.[ReviewReactionType.LIKE]).toBe(11);

      const reactionCache = queryClient.getQueryData<ReviewReactionType | null>(
        [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      );
      expect(reactionCache).toBe(ReviewReactionType.LIKE);
    });

    await act(async () => {
      resolveApi({});
      await apiPromise;
    });
  });

  it("이미 선택한 리액션을 다시 클릭하면 선택 해제(카운트 1 감소)되어야 한다", async () => {
    // 셋업: 기존에 이미 LIKE를 클릭한 상태라고 가정
    queryClient.setQueryData(
      [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      ReviewReactionType.LIKE,
    );

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(ReviewReactionType.LIKE);
    });

    const reviewCache = queryClient.getQueryData<Review>(
      reviewKeys.detail(mockReviewId).queryKey,
    );
    // 10에서 1 감소하여 9가 되어야 함 (mock 초기값이 10이므로 본래 9였던 것이라고 가정되는 로직에 따라 즉시 차감됨)
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.LIKE]).toBe(9);

    const reactionCache = queryClient.getQueryData<ReviewReactionType | null>([
      ...reviewKeys.detail(mockReviewId).queryKey,
      "reaction",
    ]);
    expect(reactionCache).toBeNull(); // 상태 초기화 확인
  });

  it("다른 리액션으로 변경 시 이전 것은 감소하고 새로운 것은 증가해야 한다", async () => {
    // 셋업: 기존에 LIKE를 클릭한 상태
    queryClient.setQueryData(
      [...reviewKeys.detail(mockReviewId).queryKey, "reaction"],
      ReviewReactionType.LIKE,
    );

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      // LIKE -> INSIGHTFUL 로 변경 시도
      result.current.mutate(ReviewReactionType.INSIGHTFUL);
    });

    const reviewCache = queryClient.getQueryData<Review>(
      reviewKeys.detail(mockReviewId).queryKey,
    );
    // LIKE는 10 -> 9
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.LIKE]).toBe(9);
    // INSIGHTFUL은 5 -> 6
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.INSIGHTFUL]).toBe(
      6,
    );

    const reactionCache = queryClient.getQueryData<ReviewReactionType | null>([
      ...reviewKeys.detail(mockReviewId).queryKey,
      "reaction",
    ]);
    expect(reactionCache).toBe(ReviewReactionType.INSIGHTFUL);
  });

  it("API 호출 실패 시, 리뷰 리액션 카운트와 내 리액션 캐시가 모두 롤백되어야 한다", async () => {
    vi.mocked(apis.toggleReviewReaction).mockRejectedValueOnce(
      new Error("Server error"),
    );

    const { result } = renderHook(
      () => useToggleReviewReactionMutation(mockReviewId),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate(ReviewReactionType.SUPPORT);
    });

    // 롤백 확인
    const reviewCache = queryClient.getQueryData<Review>(
      reviewKeys.detail(mockReviewId).queryKey,
    );
    // 2 (+1 실패 후 롤백) -> 2 유지
    expect(reviewCache?.reactionCounts?.[ReviewReactionType.SUPPORT]).toBe(2);

    const reactionCache = queryClient.getQueryData<ReviewReactionType | null>([
      ...reviewKeys.detail(mockReviewId).queryKey,
      "reaction",
    ]);
    // 실패했으므로 내 리액션은 여전히 null이어야 함
    expect(reactionCache).toBeNull();
  });
});
