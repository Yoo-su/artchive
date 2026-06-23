import { API_PATHS, BaseBookInfo, BookStats, DEFAULT_DISPLAY, DEFAULT_SORT, DEFAULT_START, GetBookDetailSuccessResponse, GetBookListParams, GetBookListSuccessResponse } from "@bookjeok/core";
import { AxiosInstance } from "axios";

/**
 * 책 검색결과를 조회합니다.
 */
export const getBookList = async (
  client: AxiosInstance,
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  const displayParam = (params.display ?? DEFAULT_DISPLAY).toString();
  const startParam = (params.start ?? DEFAULT_START).toString();
  const sortParam = params.sort ?? DEFAULT_SORT;

  const { data } = await client.get(API_PATHS.book.list, {
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
 * 네이버 책 검색결과를 직접 조회합니다. (Expo 등 외부 연동용)
 */
export const getExternalBookList = async (
  client: AxiosInstance,
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  const displayParam = (params.display ?? DEFAULT_DISPLAY).toString();
  const startParam = (params.start ?? DEFAULT_START).toString();
  const sortParam = params.sort ?? DEFAULT_SORT;

  const { data } = await client.get(API_PATHS.book.externalList, {
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
  client: AxiosInstance,
  isbn: string,
): Promise<GetBookDetailSuccessResponse> => {
  const { data } = await client.get(API_PATHS.book.detail, {
    params: { isbn },
  });

  return data;
};

/**
 * 네이버 책 상세정보를 직접 조회합니다. (Expo 등 외부 연동용)
 */
export const getExternalBookDetail = async (
  client: AxiosInstance,
  isbn: string,
): Promise<GetBookDetailSuccessResponse> => {
  const { data } = await client.get(API_PATHS.book.externalDetail, {
    params: { isbn },
  });

  return data;
};

/**
 * 책 상세페이지 조회수를 기록합니다.
 */
export const recordBookView = async (
  client: AxiosInstance,
  isbn: string,
): Promise<void> => {
  await client.post(API_PATHS.book.recordView(isbn));
};

/**
 * 인기책 목록을 조회합니다.
 */
export const getPopularBooks = async (
  client: AxiosInstance,
): Promise<BaseBookInfo[]> => {
  const { data } = await client.get<BaseBookInfo[]>(
    API_PATHS.book.popularBooks,
  );
  return data;
};

/**
 * 저장된 책 요약 정보를 조회합니다.
 */
export const getSavedBookSummary = async (
  client: AxiosInstance,
  isbn: string,
) => {
  const { data } = await client.get(API_PATHS.llm.getSummary(isbn));
  return data;
};

/**
 * 책에 대한 요약 및 후기를 생성하거나 조회합니다.
 */
export const getBookSummary = async (
  client: AxiosInstance,
  title: string,
  author: string,
  description?: string,
  isbn?: string,
  publisher?: string,
) => {
  const { data } = await client.post(API_PATHS.llm.summary, {
    title,
    author,
    description,
    isbn,
    publisher,
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
export const recordSearchKeyword = async (
  client: AxiosInstance,
  keyword: string,
): Promise<void> => {
  await client.post(API_PATHS.searchKeyword.record, { keyword });
};

/**
 * 인기 검색어 목록을 조회합니다.
 */
export const getPopularKeywords = async (
  client: AxiosInstance,
): Promise<PopularKeyword[]> => {
  const { data } = await client.get<PopularKeyword[]>(
    API_PATHS.searchKeyword.popular,
  );
  return data;
};

/**
 * 책 통계 정보를 조회합니다 (읽은 유저 수, 위시리스트 유저 수).
 */
export const getBookStats = async (
  client: AxiosInstance,
  isbn: string,
): Promise<BookStats> => {
  const { data } = await client.get<BookStats>(API_PATHS.book.stats(isbn));
  return data;
};
