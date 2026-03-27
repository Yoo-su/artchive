import { GetBookListParams } from "@bookjeok/core/book";
import { useBookDetailQuery as useBaseBookDetailQuery, useBookListQuery as useBaseBookListQuery, useBookSummaryQuery as useBaseBookSummaryQuery, useInfiniteBookSearch as useBaseInfiniteBookSearch, usePopularBooksQuery as useBasePopularBooksQuery, usePopularKeywordsQuery as useBasePopularKeywordsQuery } from "@bookjeok/react-query/book";

import { internalAxios } from "@/shared/libs/axios";

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
 * 인기책 목록 (프록시 인스턴스 주입)
 */
export const usePopularBooksQuery = () =>
  useBasePopularBooksQuery(internalAxios);

/**
 * LLM 책 요약 조회 (프록시 인스턴스 주입)
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
    internalAxios,
  );

/**
 * 인기 검색어 목록 (프록시 인스턴스 주입)
 */
export const usePopularKeywordsQuery = (staleTime?: number) =>
  useBasePopularKeywordsQuery(internalAxios, staleTime);

