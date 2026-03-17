import { SortBy, SortOption, SortOrder } from "../types";

// 중고책 마켓 가격 필터 최대값
export const MAX_MARKET_PRICE = 100000;

// 필터 미선택 sentinel 값 (지역 선택 등)
export const FILTER_ALL = "all" as const;

// 기본 정렬 값
export const DEFAULT_SORT_BY: SortBy = "createdAt";
export const DEFAULT_SORT_ORDER: SortOrder = "DESC";
export const DEFAULT_SORT_OPTION: SortOption = "createdAt_DESC";
