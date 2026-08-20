"use client";
import { getBookDetail, getBookList, getBookStats, getBookSummary, getExternalBookDetail, getExternalBookList, getPopularBooks, getPopularKeywords,getSavedBookSummary } from "@bookjeok/api-client";
import { AiBookSummaryData,bookKeys, BookStats, DEFAULT_DISPLAY, GetBookListParams } from "@bookjeok/core";
import { keepPreviousData,useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

/**
 * 책 목록 조회
 */
export const useBookListQuery = (
  params: GetBookListParams,
) => {
  return useQuery({
    queryKey: bookKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getBookList(params);
      return result.items || [];
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시 유지 (하이드레이션 직후 불필요한 재요청 방지)
  });
};

/**
 * 책 상세 조회
 */
export const useBookDetailQuery = (isbn: string) => {
  return useQuery({
    queryKey: bookKeys.detail(isbn).queryKey,
    queryFn: async () => {
      const response = await getBookDetail(isbn);
      return response.items?.[0] || null;
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시 유지 (하이드레이션 직후 불필요한 재요청 방지)
  });
};

/**
 * 알라딘 책 목록 직접 조회 (Expo 등)
 */
export const useExternalBookListQuery = (
  params: GetBookListParams,
) => {
  return useQuery({
    queryKey: [...bookKeys.list(params).queryKey, "external"],
    queryFn: async () => {
      const result = await getExternalBookList(params);
      return result.items || [];
    },
  });
};

/**
 * 알라딘 책 상세 직접 조회 (Expo 등)
 */
export const useExternalBookDetailQuery = (isbn: string) => {
  return useQuery({
    queryKey: [...bookKeys.detail(isbn).queryKey, "external"],
    queryFn: async () => {
      const response = await getExternalBookDetail(isbn);
      return response.items?.[0] || null;
    },
  });
};

/**
 * 책 검색 (무한 스크롤)
 */
export const useInfiniteBookSearch = (
  query: string,
) => {
  return useInfiniteQuery({
    queryKey: bookKeys.search(query).queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params: GetBookListParams = {
        query,
        display: DEFAULT_DISPLAY,
        start: (pageParam - 1) * DEFAULT_DISPLAY + 1,
      };
      const result = await getBookList(params);
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
export const usePopularBooksQuery = () => {
  return useQuery({
    queryKey: bookKeys.popularBooks.queryKey,
    queryFn: () => getPopularBooks(),
  });
};

/**
 * LLM 책 요약 조회 (저장된 정보 조회)
 */
export const useBookSummaryQuery = (
  isbn: string,
) => {
  return useQuery({
    queryKey: ["bookSummary", isbn],
    queryFn: async () => {
      try {
        const result = await getSavedBookSummary(isbn);
        return result || null;
      } catch {
        return null;
      }
    },
    enabled: !!isbn,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useGenerateBookSummaryMutation = (
  options?: {
    onSuccess?: (data: AiBookSummaryData) => void;
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
      return getBookSummary(title, author, description, isbn, publisher);
    },
    ...options,
  });
};

/**
 * 인기 검색어 목록
 */
export const usePopularKeywordsQuery = (
  staleTime?: number,
) => {
  return useQuery({
    queryKey: bookKeys.popularKeywords.queryKey,
    queryFn: () => getPopularKeywords(),
    staleTime: staleTime,
    refetchOnMount: true,
  });
};

/**
 * 책 통계 조회
 */
export const useBookStatsQuery = (isbn: string) => {
  return useQuery({
    queryKey: bookKeys.stats(isbn).queryKey,
    queryFn: () => getBookStats(isbn),
    enabled: !!isbn,
  });
};
