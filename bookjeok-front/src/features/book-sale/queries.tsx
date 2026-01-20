"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import {
  getBookSaleDetail,
  getMyBookSales,
  getPopularBookSales,
  getRecentBookSales,
  getRelatedSales,
  getSaleForEdit,
  searchBookSales,
} from "./apis";
import {
  SearchBookSalesParams,
  UseInfiniteRelatedSalesQueryProps,
} from "./types";

/**
 * 판매글 검색 (무한 스크롤)
 */
export const useInfiniteBookSalesQuery = (params: SearchBookSalesParams) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.bookKeys.marketSales(params).queryKey,
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
    queryKey: QUERY_KEYS.bookKeys.mySales.queryKey,
    queryFn: async () => {
      const result = await getMyBookSales();
      return result;
    },
    staleTime: 30 * 1000,
  });
};

/**
 * 판매글 상세 조회
 */
export const useBookSaleDetailQuery = (saleId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.saleDetail(saleId).queryKey,
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
    queryKey: QUERY_KEYS.bookKeys.saleForEdit(saleId).queryKey,
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
    queryKey: QUERY_KEYS.bookKeys.relatedSales({ isbn, city, district, limit })
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
    queryKey: QUERY_KEYS.bookKeys.relatedSales({ isbn, limit }).queryKey,
    queryFn: () => getRelatedSales({ isbn, page: 1, limit }),
    enabled: !!isbn && enabled,
  });
};

/**
 * 최근 판매글 목록
 */
export const useRecentBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.recentSales.queryKey,
    queryFn: getRecentBookSales,
  });
};

/**
 * 인기 판매글 목록
 */
export const usePopularBookSalesQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.popularSales.queryKey,
    queryFn: getPopularBookSales,
  });
};
