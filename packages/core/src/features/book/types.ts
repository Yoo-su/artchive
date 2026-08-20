import { ApiResponse } from "../../shared/types/api";

export type BookSortParam = "sim" | "date";
export type AladinQueryType = "Keyword" | "Title" | "Author" | "Publisher";

export interface GetBookListParams {
  query: string;
  display?: number;
  start?: number;
  sort?: BookSortParam;
  queryType?: AladinQueryType;
}

/**
 * 알라딘 Open API 도서 항목 원본 구조
 */
export interface AladinBookItem {
  title: string;
  link: string;
  author: string;
  pubDate: string;
  description: string;
  fullDescription?: string;
  fullDescription2?: string;
  isbn: string;
  isbn13: string;
  itemId: number;
  priceSales?: number;
  priceStandard?: number;
  mallType?: string;
  stockStatus?: string;
  mileage?: number;
  cover: string;
  categoryId?: number;
  categoryName?: string;
  publisher: string;
  customerReviewRank?: number;
  bestDuration?: string;
  bestRank?: number;
}

/**
 * 알라딘 Open API 검색/조회 응답 원본 구조
 */
export interface AladinSearchResponse {
  title: string;
  link: string;
  logo?: string;
  pubDate: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query?: string;
  searchCategoryId?: number;
  searchCategoryName?: string;
  item: AladinBookItem[];
}

/**
 * 책 정보의 공통 필드 (백엔드 DB 및 UI 컴포넌트 모두에서 사용)
 * - 슬라이더, 카드 등 UI 컴포넌트에서 필요한 최소 필드
 */
export interface BaseBookInfo {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
}

/**
 * 서비스 표준 도서 정보 형태 (알라딘 API 데이터 매핑)
 */
export interface BookInfo extends BaseBookInfo {
  link: string;
  discount: string;
  pubdate: string;
}

/**
 * Book List 조회 관련 타입
 */
export interface GetBookListResponseData {
  display: number;
  items: BookInfo[];
  lastBuildDate: string;
  start: number;
  total: number;
}
export type GetBookListSuccessResponse = GetBookListResponseData;

export interface GetBookListErrorResponse {
  success: false;
  message: string;
}

/**
 * Book Detail 조회 관련 타입
 */
export interface GetBookDetailResponseData {
  display: number;
  items: BookInfo[];
  lastBuildDate: string;
  start: number;
  total: number;
}

export type GetBookDetailSuccessResponse = GetBookDetailResponseData;

export interface GetBookDetailErrorResponse {
  success: false;
  message: string;
}

export interface BookStats {
  readingUserCount: number;
  wishlistUserCount: number;
}

export interface AiBookSummaryData {
  isbn: string;
  summary: string;
  keyPoints: string[];
  targetAudience: string;
  keywords: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 실시간 인기 검색어 항목
 */
export interface PopularKeyword {
  keyword: string;
  searchCount: number;
}

/**
 * AI 도서 검색/추천 결과 도서 아이템
 */
export interface AiSearchBookItem {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
  similarity: number;
  reason?: string;
}

/**
 * AI 도서 대화 SSE(Server-Sent Events) 스트림 이벤트
 */
export type AiSearchSseEvent =
  | { type: "searching"; message: string }
  | { type: "books"; books: AiSearchBookItem[] }
  | { type: "text"; chunk: string }
  | { type: "done" }
  | { type: "error"; message: string };


