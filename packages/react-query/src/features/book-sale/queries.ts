"use client";
import {
  getAvailableRegions,
  getBookSaleDetail,
  getBookSales,
  getMyBookSales,
  getPopularBookSales,
  getRecentBookSales,
  getRelatedSales,
  getSaleForEdit,
} from "@bookjeok/api-client";
import {
  bookSaleKeys,
  CACHE_TIME,
  SearchBookSalesParams,
  UsedBookSale,
  UseInfiniteRelatedSalesQueryProps,
} from "@bookjeok/core";
import {
  useInfiniteQuery,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * 판매글 검색 (무한 스크롤)
 */
export const useInfiniteBookSalesQuery = (
  params: SearchBookSalesParams,
) => {
  return useInfiniteQuery({
    queryKey: bookSaleKeys.marketSales(params).queryKey,
    queryFn: ({ pageParam }) =>
      getBookSales({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });
};

/**
 * 내 판매글 목록 (내 데이터 - 짧은 staleTime)
 */
export const useMyBookSalesQuery = () => {
  return useQuery({
    queryKey: bookSaleKeys.mySales.queryKey,
    queryFn: () => getMyBookSales(),
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};

/**
 * 판매글 상세 조회
 */
export const useBookSaleDetailQuery = (
  saleId: string,
) => {
  return useQuery({
    queryKey: bookSaleKeys.saleDetail(saleId).queryKey,
    queryFn: () => getBookSaleDetail(saleId),
    enabled: !!saleId,
    // ISR(5분) 캐시 HTML 교정용
    // - 전역 기본값(staleTime: Infinity, refetchOnMount: false)이면 판매 상태가 영구 미갱신
    // - refetchOnMount는 staleness와 무관한 절대 게이트라 staleTime 단독으로는 리페치 불가
    staleTime: 0,
    refetchOnMount: true,
  });
};

/**
 * 수정용 판매글 조회 (본인 글만 조회 가능)
 */
export const useBookSaleForEditQuery = (
  saleId: string,
) => {
  return useQuery({
    queryKey: bookSaleKeys.saleForEdit(saleId).queryKey,
    queryFn: () => getSaleForEdit(saleId),
    enabled: !!saleId,
    retry: false,
  });
};

/**
 * 관련 판매글 (무한 스크롤)
 */
export const useInfiniteRelatedSalesQuery = ({
  isbn,
  city,
  district,
  limit = 10,
  enabled = true,
}: UseInfiniteRelatedSalesQueryProps) => {
  return useInfiniteQuery({
    queryKey: bookSaleKeys.relatedSales({ isbn, city, district, limit })
      .queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getRelatedSales({
        isbn,
        page: pageParam as number,
        limit,
        city,
        district,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasNextPage ? allPages.length + 1 : undefined;
    },
    enabled: !!isbn && enabled,
  });
};

/**
 * 관련 판매글 (제한된 개수)
 */
export const useRelatedSalesQuery = ({
  isbn,
  limit = 4,
  enabled = true,
}: {
  isbn: string;
  limit?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: bookSaleKeys.relatedSales({ isbn, limit }).queryKey,
    queryFn: () => getRelatedSales({ isbn, page: 1, limit }),
    enabled: !!isbn && enabled,
  });
};

/**
 * 최근 판매글 목록
 *
 * 전역 기본값이 staleTime: Infinity이므로, 실시간성이 필요한 화면(마켓 히어로 등)은
 * options로 staleTime/refetchInterval을 덮어씁니다.
 */
export const useRecentBookSalesQuery = (
  limit: number = 25,
  options?: Pick<
    UseQueryOptions<UsedBookSale[]>,
    "staleTime" | "refetchInterval" | "refetchOnMount"
  >,
) => {
  return useQuery({
    queryKey: bookSaleKeys.recentSales(limit).queryKey,
    queryFn: () => getRecentBookSales(limit),
    ...options,
  });
};

/**
 * 인기 판매글 목록
 */
export const usePopularBookSalesQuery = () => {
  return useQuery({
    queryKey: bookSaleKeys.popularSales.queryKey,
    queryFn: () => getPopularBookSales(),
  });
};

/**
 * 현재 활성화된 중고책 판매글 지역(시/도 -> 시/군/구[]) 목록 조회 (5분 staleTime)
 */
export const useBookSaleRegionsQuery = () => {
  return useQuery({
    queryKey: bookSaleKeys.availableRegions.queryKey,
    queryFn: () => getAvailableRegions(),
    staleTime: CACHE_TIME.FIVE_MINUTES,
  });
};
