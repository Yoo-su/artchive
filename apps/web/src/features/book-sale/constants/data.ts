import { SaleStatus, SortBy, SortOrder } from "../types";

// 유효한 sortBy 값 목록
export const VALID_SORT_BY: ReadonlySet<string> = new Set<SortBy>([
  "createdAt",
  "price",
  "distance",
]);

// 유효한 sortOrder 값 목록
export const VALID_SORT_ORDER: ReadonlySet<string> = new Set<SortOrder>([
  "ASC",
  "DESC",
]);

// 유효한 SaleStatus 값 Set (런타임 검증용)
export const VALID_SALE_STATUSES: ReadonlySet<string> = new Set<string>(
  Object.values(SaleStatus),
);
