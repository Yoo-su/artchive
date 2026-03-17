"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { CACHE_TIME } from "@/shared/constants/cache";

import {
  getBookSaleDetail,
  getMyBookSales,
  getPopularBookSales,
  getRecentBookSales,
  getRelatedSales,
  getSaleForEdit,
  searchBookSales,
} from "./apis";
import { bookSaleKeys } from "./constants/query-keys";
import {
  SearchBookSalesParams,
  UseInfiniteRelatedSalesQueryProps,
} from "./types";

/**
 * 판매글 검색 (무한 스크롤)
 */
export const useInfiniteBookSalesQuery = (params: SearchBookSalesParams) => {
  return useInfiniteQuery({
    queryKey: bookSaleKeys.marketSales(params).queryKey,
    queryFn: ({ pageParam }) =>
      searchBookSales({
        ...params,
        cursor: pageParam ? (pageParam as string) : undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor ?? undefined;
    },
  });
};

/**
 * 내 판매글 목록 (내 데이터 - 짧은 staleTime)
 */
export const useMyBookSalesQuery = () => {
  return useQuery({
    queryKey: bookSaleKeys.mySales.queryKey,
    queryFn: async () => {
      const result = await getMyBookSales();
      return result;
    },
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};

/**
 * 판매글 상세 조회
 */
export const useBookSaleDetailQuery = (saleId: string) => {
  return useQuery({
    queryKey: bookSaleKeys.saleDetail(saleId).queryKey,
    queryFn: async () => {
      const result = await getBookSaleDetail(saleId);
      return result;
    },
    enabled: !!saleId,
  });
};

/**
 * 수정용 판매글 조회 (본인 글만 조회 가능)
 */
export const useBookSaleForEditQuery = (saleId: string) => {
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
      getRelatedSales({ isbn, page: pageParam, limit, city, district }),
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
 */
export const useRecentBookSalesQuery = () => {
  return useQuery({
    queryKey: bookSaleKeys.recentSales.queryKey,
    queryFn: getRecentBookSales,
  });
};

/**
 * 인기 판매글 목록
 */
export const usePopularBookSalesQuery = () => {
  return useQuery({
    queryKey: bookSaleKeys.popularSales.queryKey,
    queryFn: getPopularBookSales,
  });
};
