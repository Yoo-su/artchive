import {
  getBookDetail as sharedGetBookDetail,
  getBookList as sharedGetBookList,
  getBookSummary as sharedGetBookSummary,
  getPopularBooks as sharedGetPopularBooks,
  getPopularKeywords as sharedGetPopularKeywords,
  recordBookView as sharedRecordBookView,
  recordSearchKeyword as sharedRecordSearchKeyword,
} from "@bookjeok/api-client";
import {
  BaseBookInfo,
  GetBookDetailSuccessResponse,
  GetBookListParams,
  GetBookListSuccessResponse,
  PopularKeyword,
} from "@bookjeok/core";


/**
 * 책 검색결과를 조회합니다.
 */
export const getBookList = async (
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  return sharedGetBookList(params);
};

/**
 * 책 상세정보를 조회합니다.
 */
export const getBookDetail = async (
  isbn: string,
): Promise<GetBookDetailSuccessResponse> => {
  return sharedGetBookDetail(isbn);
};

/**
 * 책 상세페이지 조회수를 기록합니다.
 */
export const recordBookView = async (isbn: string): Promise<void> => {
  return sharedRecordBookView(isbn);
};

/**
 * 인기책 목록을 조회합니다.
 */
export const getPopularBooks = async (): Promise<BaseBookInfo[]> => {
  return sharedGetPopularBooks();
};

/**
 * 책에 대한 요약 및 후기를 생성하거나 조회합니다.
 */
export const getBookSummary = async (
  title: string,
  author: string,
  description?: string,
) => {
  return sharedGetBookSummary(title, author, description);
};

// ===== 인기 검색어 관련 API =====

/**
 * 검색어를 기록합니다.
 */

export const recordSearchKeyword = async (keyword: string): Promise<void> => {
  return sharedRecordSearchKeyword(keyword);
};

/**
 * 인기 검색어 목록을 조회합니다.
 */
export const getPopularKeywords = async (): Promise<PopularKeyword[]> => {
  return sharedGetPopularKeywords();
};
