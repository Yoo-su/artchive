"use client";
import { getBookSaleDetail, getBookSales, getMyBookSales, getPopularBookSales, getRecentBookSales, getRelatedSales, getSaleForEdit } from "@bookjeok/api-client/book-sale";
import { CACHE_TIME } from "@bookjeok/core";
import { CommonBookSaleResponse, SearchBookSalesParams, UsedBookSale,UseInfiniteRelatedSalesQueryProps } from "@bookjeok/core/book-sale";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

import { bookSaleKeys } from "./query-keys";

/**
 * 판매글 검색 (무한 스크롤)
 */
export const useInfiniteBookSalesQuery = (params: SearchBookSalesParams, client: AxiosInstance) => {
  return useInfiniteQuery({
    queryKey: bookSaleKeys.marketSales(params).queryKey,
    queryFn: ({ pageParam }) =>
      getBookSales(client, {
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
export const useMyBookSalesQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: bookSaleKeys.mySales.queryKey,
    queryFn: () => getMyBookSales(client),
    staleTime: CACHE_TIME.THIRTY_SECONDS,
  });
};

/**
 * 판매글 상세 조회
 */
export const useBookSaleDetailQuery = (saleId: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: bookSaleKeys.saleDetail(saleId).queryKey,
    queryFn: () => getBookSaleDetail(client, saleId),
    enabled: !!saleId,
  });
};

/**
 * 수정용 판매글 조회 (본인 글만 조회 가능)
 */
export const useBookSaleForEditQuery = (saleId: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: bookSaleKeys.saleForEdit(saleId).queryKey,
    queryFn: () => getSaleForEdit(client, saleId),
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
  client,
}: UseInfiniteRelatedSalesQueryProps & { client: AxiosInstance }) => {
  return useInfiniteQuery({
    queryKey: bookSaleKeys.relatedSales({ isbn, city, district, limit })
      .queryKey,
    queryFn: ({ pageParam = 1 }) =>
      getRelatedSales(client, { isbn, page: pageParam as number, limit, city, district }),
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
  client,
}: {
  isbn: string;
  limit?: number;
  enabled?: boolean;
  client: AxiosInstance;
}) => {
  return useQuery({
    queryKey: bookSaleKeys.relatedSales({ isbn, limit }).queryKey,
    queryFn: () => getRelatedSales(client, { isbn, page: 1, limit }),
    enabled: !!isbn && enabled,
  });
};

/**
 * 최근 판매글 목록
 */
export const useRecentBookSalesQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: bookSaleKeys.recentSales.queryKey,
    queryFn: () => getRecentBookSales(client),
  });
};

/**
 * 인기 판매글 목록
 */
export const usePopularBookSalesQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: bookSaleKeys.popularSales.queryKey,
    queryFn: () => getPopularBookSales(client),
  });
};
