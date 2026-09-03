import { bookSaleKeys } from "@bookjeok/core";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getQueryClient } from "@/shared/libs/query-client";

/**
 * 전역 QueryClient 기본값 계약
 *
 * refetchOnMount는 staleness와 무관한 절대 게이트다. false로 두면
 * invalidateQueries가 비활성 쿼리에 플래그만 세우고 끝나, 그 쿼리가 다시
 * 마운트돼도 낡은 데이터가 그대로 그려진다. (판매글 등록 → 내 판매글 목록)
 */
describe("전역 QueryClient 기본값", () => {
  const queryKey = bookSaleKeys.mySales.queryKey;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    getQueryClient().clear();
  });

  it("무효화된 비활성 쿼리는 재마운트 시 리페치된다", async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce(["기존 판매글"])
      .mockResolvedValue(["기존 판매글", "방금 등록한 판매글"]);

    // 1. 내 판매글 목록을 한 번 조회한 뒤 상세 페이지로 이동 (언마운트)
    const first = renderHook(() => useQuery({ queryKey, queryFn }), {
      wrapper,
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    // 2. 다른 화면에서 판매글을 등록하고 도메인 루트 접두사로 무효화
    getQueryClient().invalidateQueries({ queryKey: bookSaleKeys._def });

    // 3. 내 판매글 목록으로 재진입
    const second = renderHook(() => useQuery({ queryKey, queryFn }), {
      wrapper,
    });

    await waitFor(() =>
      expect(second.result.current.data).toEqual([
        "기존 판매글",
        "방금 등록한 판매글",
      ]),
    );
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it("하이드레이트된 낡은 스냅샷은 마운트 시 교정된다", async () => {
    const queryFn = vi.fn().mockResolvedValue(["최신 판매글"]);

    // ISR HTML에 구워져 넘어온 스냅샷을 재현 (렌더 시점이 과거)
    getQueryClient().setQueryData(queryKey, ["1시간 전 판매글"], {
      updatedAt: Date.now() - 60 * 60 * 1000,
    });

    const { result } = renderHook(() => useQuery({ queryKey, queryFn }), {
      wrapper,
    });

    await waitFor(() =>
      expect(result.current.data).toEqual(["최신 판매글"]),
    );
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it("staleTime 안에서는 중복 요청하지 않는다", async () => {
    const queryFn = vi.fn().mockResolvedValue(["판매글"]);

    const first = renderHook(() => useQuery({ queryKey, queryFn }), {
      wrapper,
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHook(() => useQuery({ queryKey, queryFn }), {
      wrapper,
    });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(queryFn).toHaveBeenCalledTimes(1);
  });
});
