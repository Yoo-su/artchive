import { getBookDetail as sharedGetBookDetail, getBookList as sharedGetBookList, getBookSummary as sharedGetBookSummary, getPopularBooks as sharedGetPopularBooks, getPopularKeywords as sharedGetPopularKeywords, recordBookView as sharedRecordBookView, recordSearchKeyword as sharedRecordSearchKeyword } from "@bookjeok/api-client";
import { BaseBookInfo, GetBookDetailSuccessResponse, GetBookListParams, GetBookListSuccessResponse } from "@bookjeok/core";
import { AxiosInstance } from "axios";

/**
 * 책 검색결과를 조회합니다.
 */
export const getBookList = async (
  client: AxiosInstance,
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  return sharedGetBookList(client, params);
};

/**
 * 책 상세정보를 조회합니다.
 */
export const getBookDetail = async (
  client: AxiosInstance,
  isbn: string,
): Promise<GetBookDetailSuccessResponse> => {
  return sharedGetBookDetail(client, isbn);
};

/**
 * 책 상세페이지 조회수를 기록합니다.
 */
export const recordBookView = async (client: AxiosInstance, isbn: string): Promise<void> => {
  return sharedRecordBookView(client, isbn);
};

/**
 * 인기책 목록을 조회합니다.
 */
export const getPopularBooks = async (client: AxiosInstance): Promise<BaseBookInfo[]> => {
  return sharedGetPopularBooks(client);
};

/**
 * 책에 대한 요약 및 후기를 생성하거나 조회합니다.
 */
export const getBookSummary = async (
  client: AxiosInstance,
  title: string,
  author: string,
  description?: string,
) => {
  return sharedGetBookSummary(client, title, author, description);
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
export const recordSearchKeyword = async (client: AxiosInstance, keyword: string): Promise<void> => {
  return sharedRecordSearchKeyword(client, keyword);
};

/**
 * 인기 검색어 목록을 조회합니다.
 */
export const getPopularKeywords = async (client: AxiosInstance): Promise<PopularKeyword[]> => {
  return sharedGetPopularKeywords(client);
};
