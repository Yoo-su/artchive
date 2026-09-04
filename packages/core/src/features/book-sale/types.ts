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
 * 중고거래 방식 Enum
 */
export enum TradeMethod {
  DIRECT_ONLY = "DIRECT_ONLY",
  DELIVERY_ONLY = "DELIVERY_ONLY",
  BOTH = "BOTH",
}

/**
 * 판매글 작성자의 공개 프로필 정보
 */
export interface SaleAuthor {
  id: number;
  handle: string;
  nickname: string;
  profileImageUrl: string | null;
  deletedAt?: string | null;
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
  tradeMethod?: TradeMethod;
  createdAt: string;
  updatedAt: string;
  user: SaleAuthor;
  book: BookInfo;
  viewCount: number;
  latitude?: number;
  longitude?: number;
  placeName?: string;
  /**
   * 활성 주문(결제~배송 단계)이 걸려 있어 수정·삭제·상태 변경이 시스템에
   * 잠긴 판매글인지 여부. 잠금 판단은 반드시 이 값으로 해야 합니다.
   * `status === RESERVED`로 대신 판단하면 판매자가 직접 예약중으로 바꾼
   * 직거래 건까지 잠겨 판매완료로 넘어갈 수 없게 됩니다.
   *
   * 상세·내 판매글 목록 응답에만 실립니다.
   */
  hasActiveOrder?: boolean;
  /**
   * 예약중일 때 거래 상대로 지정된 사용자 ID.
   *
   * 예약중은 다른 구매희망자에게 "이 분과 얘기 중"이라고 알리는 신호이므로,
   * 상대가 누구인지 알아야 다른 채팅방에 안내를 띄우고 완료 시 후기 상대를
   * 정할 수 있습니다. 상대 없이 예약중으로만 두는 것도 허용되므로 null일 수 있습니다.
   */
  reservedForUserId?: number | null;
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
  tradeMethod?: TradeMethod;
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
  tradeMethod: TradeMethod;
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

/**
 * 현재 활성화된 중고책 판매글 지역 목록 응답 타입 (시/도 -> 시/군/구[])
 */
export type GetAvailableRegionsResponse = Record<string, string[]>;
