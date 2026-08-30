import * as apis from "@bookjeok/api-client";
import { bookSaleKeys, SaleStatus, UsedBookSale } from "@bookjeok/core";
import { useRecentBookSalesQuery } from "@bookjeok/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@bookjeok/api-client", () => ({
  getRecentBookSales: vi.fn(),
}));

const mockRecentSales: UsedBookSale[] = [
  {
    id: 1,
    title: "중고책 1",
    price: 12000,
    status: SaleStatus.FOR_SALE,
    sellerId: 1,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    isbn: "1234567890",
    imageUrls: [],
    city: "서울",
    district: "강남구",
  } as unknown as UsedBookSale,
];

describe("useRecentBookSalesQuery - ISR and Query Key consistency", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("home page ISR prefetch queryKey matches useRecentBookSalesQuery() queryKey", () => {
    // page.tsx의 ISR prefetch에서 사용되는 쿼리 키 (bookSaleKeys.recentSales(25).queryKey)
    const homePrefetchQueryKey = bookSaleKeys.recentSales(25).queryKey;

    // 데이터를 ISR prefetch 키로 미리 캐시에 주입
    queryClient.setQueryData(homePrefetchQueryKey, mockRecentSales);

    // 컴포넌트에서 기본 파라미터(limit = 25)로 useRecentBookSalesQuery() 호출
    const { result } = renderHook(() => useRecentBookSalesQuery(), {
      wrapper,
    });

    // 쿼리키가 일치하므로 캐시된 데이터가 즉시 반환되어야 하고, 추가 API 호출이 없어야 함
    expect(result.current.data).toEqual(mockRecentSales);
    expect(result.current.isLoading).toBe(false);
    expect(apis.getRecentBookSales).not.toHaveBeenCalled();
  });

  it("custom limit queryKey matches when provided to query-key factory and hook", () => {
    const customLimitKey = bookSaleKeys.recentSales(10).queryKey;
    queryClient.setQueryData(customLimitKey, mockRecentSales);

    const { result } = renderHook(() => useRecentBookSalesQuery(10), {
      wrapper,
    });

    expect(result.current.data).toEqual(mockRecentSales);
    expect(result.current.isLoading).toBe(false);
    expect(apis.getRecentBookSales).not.toHaveBeenCalled();
  });
});
