import { BookInfo } from "../book/types";

/**
 * 중고책 판매글의 상태를 나타내는 Enum
 */
export enum SaleStatus {
  FOR_SALE = "FOR_SALE",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
}

/**
 * 판매글 작성자의 공개 프로필 정보
 */
export interface SaleAuthor {
  id: number;
  handle: string;
  nickname: string;
  profileImageUrl: string | null;
}

/**
 * 중고책 판매 게시글의 전체 데이터 구조
 */
export interface UsedBookSale {
  id: number;
  title: string;
  price: number;
  city: string;
  district: string;
  content: string;
  imageUrls: string[];
  status: SaleStatus;
  createdAt: string;
  updatedAt: string;
  user: SaleAuthor;
  book: BookInfo;
  viewCount: number;
  latitude?: number;
  longitude?: number;
  placeName?: string;
}

/**
 * 판매글 생성 요청 파라미터
 */
export interface CreateBookSaleParams {
  title: string;
  price: number;
  city: string;
  district: string;
  content: string;
  imageUrls: string[];
  latitude?: number;
  longitude?: number;
  placeName?: string;
  isbn: string;
}

/**
 * 판매글 수정 요청 파라미터
 */
export type UpdateBookSaleParams = Partial<{
  title: string;
  price: number;
  city: string;
  district: string;
  content: string;
  imageUrls: string[];
  latitude: number;
  longitude: number;
  placeName: string;
}>;

/**
 * 허용되는 정렬 기준
 */
export type SortBy = "createdAt" | "price" | "distance" | "title";

/**
 * 허용되는 정렬 방향
 */
export type SortOrder = "ASC" | "DESC";

/**
 * 필터 폼에서 사용하는 정렬 조합
 */
export type SortOption =
  | "createdAt_DESC"
  | "price_ASC"
  | "price_DESC"
  | "distance_ASC"
  | "title_ASC"
  | "title_DESC";

/**
 * 판매글 검색 요청 파라미터
 */
export interface SearchBookSalesParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: SaleStatus[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  lat?: number;
  lng?: number;
  radius?: number;
  cursor?: string;
}

/**
 * 판매글 검색 응답
 */
export interface SearchBookSalesResponse {
  sales: UsedBookSale[];
  total?: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  nextCursor?: string;
}

/**
 * ISBN별 관련 판매글 조회 파라미터
 */
export interface GetRelatedSalesParams {
  isbn: string;
  page: number;
  limit: number;
  city?: string;
  district?: string;
}

/**
 * ISBN별 관련 판매글 응답
 */
export interface GetRelatedSalesResponse {
  sales: UsedBookSale[];
  total?: number;
  page: number;
  hasNextPage: boolean;
}

export interface UseInfiniteRelatedSalesQueryProps {
  isbn: string;
  city?: string;
  district?: string;
  limit?: number;
  enabled?: boolean;
}

export type CommonBookSaleResponse = UsedBookSale;
export type GetMyBookSalesResponse = UsedBookSale[];

/**
 * 중고책 마켓 필터 폼의 입력 타입
 */
export interface FilterFormInputs {
  search: string;
  city: string;
  district: string;
  status: SaleStatus[];
  priceRange: [number, number];
  sort: SortOption;
}
