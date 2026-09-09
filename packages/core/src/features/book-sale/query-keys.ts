import { createQueryKeys } from "@lukemorales/query-key-factory";

import {
  SearchBookSalesParams,
  UseInfiniteRelatedSalesQueryProps,
} from "./types";

/**
 * 중고책 판매 관련 쿼리 키 팩토리
 */
export const bookSaleKeys = createQueryKeys("bookSale", {
  marketSales: (params: SearchBookSalesParams) => ({
    queryKey: ["market", params],
  }),
  popularSales: null,
  mySales: null,
  relatedSales: ({
    isbn,
    city,
    district,
    limit,
  }: Omit<UseInfiniteRelatedSalesQueryProps, "enabled">) => ({
    queryKey: [isbn, city, district, limit],
  }),
  saleDetail: (saleId: string) => ({
    queryKey: [saleId],
  }),
  saleForEdit: (saleId: string | number) => ({
    queryKey: ["edit", saleId],
  }),
  recentSales: (limit: number = 25) => ({
    queryKey: [limit],
  }),
  availableRegions: null,
});
