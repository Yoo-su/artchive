"use client";
import { getBookDetail, getBookList, getBookStats, getBookSummary, getExternalBookDetail, getExternalBookList, getPopularBooks, getPopularKeywords,getSavedBookSummary } from "@bookjeok/api-client";
import { bookKeys, BookStats, DEFAULT_DISPLAY, GetBookListParams } from "@bookjeok/core";
import { useInfiniteQuery, useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

/**
 * 책 목록 조회
 */
export const useBookListQuery = (
  params: GetBookListParams,
  client: AxiosInstance,
) => {
  return useQuery({
    queryKey: bookKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getBookList(client, params);
      return result.items || [];
    },
  });
};

/**
 * 책 상세 조회
 */
export const useBookDetailQuery = (isbn: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: bookKeys.detail(isbn).queryKey,
    queryFn: async () => {
      const response = await getBookDetail(client, isbn);
      return response.items?.[0] || null;
    },
  });
};

/**
 * 네이버 책 목록 직접 조회 (Expo 등)
 */
export const useExternalBookListQuery = (
  params: GetBookListParams,
  client: AxiosInstance,
) => {
  return useQuery({
    queryKey: [...bookKeys.list(params).queryKey, "external"],
    queryFn: async () => {
      const result = await getExternalBookList(client, params);
      return result.items || [];
    },
  });
};

/**
 * 네이버 책 상세 직접 조회 (Expo 등)
 */
export const useExternalBookDetailQuery = (isbn: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: [...bookKeys.detail(isbn).queryKey, "external"],
    queryFn: async () => {
      const response = await getExternalBookDetail(client, isbn);
      return response.items?.[0] || null;
    },
  });
};

/**
 * 책 검색 (무한 스크롤)
 */
export const useInfiniteBookSearch = (
  query: string,
  client: AxiosInstance,
) => {
  return useInfiniteQuery({
    queryKey: bookKeys.search(query).queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params: GetBookListParams = {
        query,
        display: DEFAULT_DISPLAY,
        start: (pageParam - 1) * DEFAULT_DISPLAY + 1,
      };
      const result = await getBookList(client, params);
      return {
        items: result.items,
        currentPage: pageParam,
        isLastPage: result.items.length < DEFAULT_DISPLAY,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.isLastPage) return undefined;
      return lastPage.currentPage + 1;
    },
    enabled: !!query,
    placeholderData: keepPreviousData,
  });
};

/**
 * 인기책 목록
 */
export const usePopularBooksQuery = (client: AxiosInstance) => {
  return useQuery({
    queryKey: bookKeys.popularBooks.queryKey,
    queryFn: () => getPopularBooks(client),
  });
};

/**
 * LLM 책 요약 조회 (저장된 정보 조회)
 */
export const useBookSummaryQuery = (
  isbn: string,
  client?: AxiosInstance,
) => {
  return useQuery({
    queryKey: ["bookSummary", isbn],
    queryFn: async () => {
      if (!client) return null;
      try {
        const result = await getSavedBookSummary(client, isbn);
        return result || null;
      } catch {
        return null;
      }
    },
    enabled: !!isbn && !!client,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

/**
 * LLM 책 요약 생성 Mutation
 */
export const useGenerateBookSummaryMutation = (
  client?: AxiosInstance,
  options?: {
    onSuccess?: (data: any) => void;
    onError?: (error: unknown) => void;
  },
) => {
  return useMutation({
    mutationFn: async ({
      title,
      author,
      description,
      isbn,
      publisher,
    }: {
      title: string;
      author: string;
      description?: string;
      isbn?: string;
      publisher?: string;
    }) => {
      if (!client) throw new Error("API client is required");
      return getBookSummary(client, title, author, description, isbn, publisher);
    },
    ...options,
  });
};

/**
 * 인기 검색어 목록
 */
export const usePopularKeywordsQuery = (
  client: AxiosInstance,
  staleTime?: number,
) => {
  return useQuery({
    queryKey: bookKeys.popularKeywords.queryKey,
    queryFn: () => getPopularKeywords(client),
    staleTime: staleTime,
    refetchOnMount: true,
  });
};

/**
 * 책 통계 조회
 */
export const useBookStatsQuery = (isbn: string, client: AxiosInstance) => {
  return useQuery({
    queryKey: bookKeys.stats(isbn).queryKey,
    queryFn: () => getBookStats(client, isbn),
    enabled: !!isbn,
  });
};
