import { API_PATHS } from "@/shared/constants/apis";
import { internalAxios, privateAxios, publicAxios } from "@/shared/libs/axios";

import { DEFAULT_DISPLAY, DEFAULT_SORT, DEFAULT_START } from "../constants";
import {
  BaseBookInfo,
  GetBookDetailErrorResponse,
  GetBookDetailSuccessResponse,
  GetBookListErrorResponse,
  GetBookListParams,
  GetBookListSuccessResponse,
} from "../types";

/**
 * 책 검색결과를 조회합니다.
 */
export const getBookList = async (
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  const displayParam = (params.display ?? DEFAULT_DISPLAY).toString();
  const startParam = (params.start ?? DEFAULT_START).toString();
  const sortParam = params.sort ?? DEFAULT_SORT;

  const { data } = await internalAxios.get(API_PATHS.book.list, {
    params: {
      query: params.query,
      display: displayParam,
      start: startParam,
      sort: sortParam,
    },
  });

  return data;
};

/**
 * 책 상세정보를 조회합니다.
 */
export const getBookDetail = async (
  isbn: string,
): Promise<GetBookDetailSuccessResponse> => {
  const { data } = await internalAxios.get(API_PATHS.book.detail, {
    params: { isbn },
  });

  return data;
};

/**
 * 책 상세페이지 조회수를 기록합니다.
 */
export const recordBookView = async (isbn: string): Promise<void> => {
  await publicAxios.post(API_PATHS.book.recordView(isbn));
};

/**
 * 인기책 목록을 조회합니다.
 */
export const getPopularBooks = async (): Promise<BaseBookInfo[]> => {
  const { data } = await publicAxios.get<BaseBookInfo[]>(
    API_PATHS.book.popularBooks,
  );
  return data;
};

/**
 * 책에 대한 요약 및 후기를 생성하거나 조회합니다.
 */
export const getBookSummary = async (
  title: string,
  author: string,
  description?: string,
) => {
  const { data } = await privateAxios.post(API_PATHS.llm.summary, {
    title,
    author,
    description,
  });
  return data;
};

// ===== 인기 검색어 관련 API =====

/** 인기 검색어 응답 타입 */
export interface PopularKeyword {
  keyword: string;
  searchCount: number;
}

/**
 * 검색어를 기록합니다.
 */
export const recordSearchKeyword = async (keyword: string): Promise<void> => {
  await publicAxios.post(API_PATHS.searchKeyword.record, { keyword });
};

/**
 * 인기 검색어 목록을 조회합니다.
 */
export const getPopularKeywords = async (): Promise<PopularKeyword[]> => {
  const { data } = await publicAxios.get<PopularKeyword[]>(
    API_PATHS.searchKeyword.popular,
  );
  return data;
};
