import { GetBookListParams } from "@bookjeok/core";
import {
  useBookDetailQuery as useBaseBookDetailQuery,
  useBookListQuery as useBaseBookListQuery,
  useBookStatsQuery as useBaseBookStatsQuery,
  useBookSummaryQuery as useBaseBookSummaryQuery,
  useGenerateBookSummaryMutation as useBaseGenerateBookSummaryMutation,
  useInfiniteBookSearch as useBaseInfiniteBookSearch,
  usePopularBooksQuery as useBasePopularBooksQuery,
  usePopularKeywordsQuery as useBasePopularKeywordsQuery,
  useRecordSearchKeywordMutation as useBaseRecordSearchKeywordMutation,
} from "@bookjeok/react-query";

/**
 * 책 목록 조회
 */
export const useBookListQuery = (params: GetBookListParams) =>
  useBaseBookListQuery(params);

/**
 * 책 상세 조회
 */
export const useBookDetailQuery = (isbn: string) =>
  useBaseBookDetailQuery(isbn);

/**
 * 책 검색 (무한 스크롤)
 */
export const useInfiniteBookSearch = (query: string) =>
  useBaseInfiniteBookSearch(query);

/**
 * 인기책 목록
 */
export const usePopularBooksQuery = () =>
  useBasePopularBooksQuery();

/**
 * LLM 책 요약 조회
 */
export const useBookSummaryQuery = (isbn: string) =>
  useBaseBookSummaryQuery(isbn);

/**
 * LLM 책 요약 생성 Mutation
 */
export const useGenerateBookSummaryMutation = (options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: unknown) => void;
}) =>
  useBaseGenerateBookSummaryMutation(options);

/**
 * 인기 검색어 목록
 */
export const usePopularKeywordsQuery = (staleTime?: number) =>
  useBasePopularKeywordsQuery(staleTime);

/**
 * 책 통계 조회
 */
export const useBookStatsQuery = (isbn: string) =>
  useBaseBookStatsQuery(isbn);

/**
 * 검색어를 기록하는 뮤테이션 훅
 */
export const useRecordSearchKeywordMutation = (options?: { onSuccess?: () => void; onError?: (error: unknown) => void }) =>
  useBaseRecordSearchKeywordMutation(options);

