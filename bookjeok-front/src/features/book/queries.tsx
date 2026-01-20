import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/shared/constants/query-keys";

import {
  getBookDetail,
  getBookList,
  getBookSummary,
  getPopularBooks,
  getPopularKeywords,
} from "./apis";
import { DEFAULT_DISPLAY } from "./constants";
import { BookInfo, GetBookListParams } from "./types";

/**
 * 책 목록 조회
 */
export const useBookListQuery = (params: GetBookListParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.list(params).queryKey,
    queryFn: async () => {
      const result = await getBookList(params);
      if (!result.success) return [] as BookInfo[];
      return result.items;
    },
  });
};

/**
 * 책 상세 조회
 */
export const useBookDetailQuery = (isbn: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.detail(isbn).queryKey,
    queryFn: async () => {
      const response = await getBookDetail(isbn);
      if (!response.success) return null;
      return response.items[0];
    },
  });
};

/**
 * 책 검색 (무한 스크롤)
 */
export const useInfiniteBookSearch = (query: string) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.bookKeys.search(query).queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      const params: GetBookListParams = {
        query,
        display: DEFAULT_DISPLAY,
        start: (pageParam - 1) * DEFAULT_DISPLAY + 1,
      };
      const result = await getBookList(params);
      if (!result.success) {
        throw new Error("Failed to fetch book list");
      }
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
  });
};

/**
 * 인기책 목록
 */
export const usePopularBooksQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.popularBooks.queryKey,
    queryFn: getPopularBooks,
  });
};

/**
 * LLM 책 요약 조회
 */
export const useBookSummaryQuery = (
  title: string,
  author: string,
  enabled: boolean,
  description?: string,
) => {
  return useQuery({
    queryKey: ["bookSummary", title, author],
    queryFn: async () => {
      const result = await getBookSummary(title, author, description);
      if (!result.success) {
        throw new Error(result.message || "요약 정보를 가져오지 못했습니다.");
      }
      return result;
    },
    enabled: enabled,
    retry: false,
  });
};

/**
 * 인기 검색어 목록
 * 최근 3일 기준 Top 10, 5분 캐싱
 */
export const usePopularKeywordsQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.bookKeys.popularKeywords.queryKey,
    queryFn: getPopularKeywords,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });
};
