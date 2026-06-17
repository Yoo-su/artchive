import { GetBookListParams } from "@bookjeok/core";
import {
  useBookDetailQuery as useBaseBookDetailQuery,
  useBookListQuery as useBaseBookListQuery,
  useBookStatsQuery as useBaseBookStatsQuery,
  useBookSummaryQuery as useBaseBookSummaryQuery,
  useInfiniteBookSearch as useBaseInfiniteBookSearch,
  usePopularBooksQuery as useBasePopularBooksQuery,
  usePopularKeywordsQuery as useBasePopularKeywordsQuery,
  useRecordSearchKeywordMutation as useBaseRecordSearchKeywordMutation,
} from "@bookjeok/react-query";

import { internalAxios, privateAxios, publicAxios } from "@/shared/libs/axios";

/**
 * 책 목록 조회 (프록시 인스턴스 주입)
 */
export const useBookListQuery = (params: GetBookListParams) =>
  useBaseBookListQuery(params, internalAxios);

/**
 * 책 상세 조회 (프록시 인스턴스 주입)
 */
export const useBookDetailQuery = (isbn: string) =>
  useBaseBookDetailQuery(isbn, internalAxios);

/**
 * 책 검색 (무한 스크롤, 프록시 인스턴스 주입)
 */
export const useInfiniteBookSearch = (query: string) =>
  useBaseInfiniteBookSearch(query, internalAxios);

/**
 * 인기책 목록 (직접 API 통신 인스턴스 주입)
 */
export const usePopularBooksQuery = () =>
  useBasePopularBooksQuery(publicAxios);

/**
 * LLM 책 요약 조회 (JWT 토큰이 필요한 직접 API 통신 인스턴스 주입)
 */
export const useBookSummaryQuery = (
  title: string,
  author: string,
  enabled: boolean,
  description?: string,
) =>
  useBaseBookSummaryQuery(
    title,
    author,
    enabled,
    description,
    privateAxios,
  );

/**
 * 인기 검색어 목록 (직접 API 통신 인스턴스 주입)
 */
export const usePopularKeywordsQuery = (staleTime?: number) =>
  useBasePopularKeywordsQuery(publicAxios, staleTime);

/**
 * 책 통계 조회 (직접 API 통신 인스턴스 주입)
 */
export const useBookStatsQuery = (isbn: string) =>
  useBaseBookStatsQuery(isbn, publicAxios);

/**
 * 검색어를 기록하는 뮤테이션 훅 (직접 API 통신 인스턴스 주입)
 */
export const useRecordSearchKeywordMutation = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) =>
  useBaseRecordSearchKeywordMutation(publicAxios, options);
