import * as apis from "@bookjeok/api-client";
import { Review, reviewKeys, User } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useReviewWithAuth } from "@/features/review/hooks/use-review-with-auth";

vi.mock("@bookjeok/api-client", () => ({
  getReview: vi.fn(),
  getReviewAuthenticated: vi.fn(),
}));

const mockUser = {
  id: 1,
  nickname: "나",
  handle: "me",
  profileImageUrl: null,
} as User;

const mockOtherUser = {
  id: 999,
  nickname: "타인",
  handle: "other",
  profileImageUrl: null,
} as User;

const mockPrivateReview = {
  id: 10,
  title: "비공개 리뷰 제목",
  content: "",
  isPublic: false,
  userId: 1,
  user: { id: 1, nickname: "나" },
} as unknown as Review;

const mockUnmaskedPrivateReview = {
  ...mockPrivateReview,
  content: "작성자 본인만 볼 수 있는 실제 비공개 본문입니다.",
} as unknown as Review;

describe("useReviewWithAuth", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(apis.getReview).mockResolvedValue(mockPrivateReview);
    useAuthStore.getState().clearAuth();

    // 서버(ServerQueryBoundary)가 하이드레이트해 넣는 경로를 재현
    queryClient.setQueryData(reviewKeys.detail(10).queryKey, mockPrivateReview);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("작성자 본인이 비공개 리뷰에 접근할 때 getReviewAuthenticated를 호출하여 원본 본문을 가져오고 로딩을 해제해야 합니다", async () => {
    // 1. 유저 로그인 상태 설정 (ID: 1)
    useAuthStore.getState().setUser(mockUser);

    vi.mocked(apis.getReviewAuthenticated).mockResolvedValue(
      mockUnmaskedPrivateReview,
    );

    // 2. 훅 렌더링 (하이드레이트된 데이터는 마스킹된 비공개 리뷰)
    const { result } = renderHook(() => useReviewWithAuth(10), { wrapper });

    // 3. getReviewAuthenticated가 호출되었는지 확인
    await waitFor(() => {
      expect(apis.getReviewAuthenticated).toHaveBeenCalledWith(10);
    });

    // 4. 원본 본문이 복구되고 isAuthenticating 및 isPrivateMasked가 false로 전환되는지 확인
    await waitFor(() => {
      expect(result.current.isAuthenticating).toBe(false);
      expect(result.current.isPrivateMasked).toBe(false);
      expect(result.current.review?.content).toBe(
        "작성자 본인만 볼 수 있는 실제 비공개 본문입니다.",
      );
    });
  });

  it("타인이 비공개 리뷰에 접근할 때는 getReviewAuthenticated를 호출하지 않고 마스킹 상태를 유지해야 합니다", async () => {
    // 1. 타인 유저 로그인 상태 (ID: 999)
    useAuthStore.getState().setUser(mockOtherUser);

    const { result } = renderHook(() => useReviewWithAuth(10), { wrapper });

    expect(result.current.isAuthor).toBe(false);
    expect(result.current.isPrivateMasked).toBe(true);
    expect(result.current.isAuthenticating).toBe(false);
    expect(apis.getReviewAuthenticated).not.toHaveBeenCalled();
  });
});
