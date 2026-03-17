import { createQueryKeys } from "@lukemorales/query-key-factory";

import {
  SearchBookSalesParams,
  UseInfiniteRelatedSalesQueryProps,
} from "../types";

/**
 * 중고책 판매 관련 쿼리 키 팩토리
 *
 * book 도메인과 분리하여 book-sale 도메인 고유의 쿼리 키를 관리합니다.
 */
export const bookSaleKeys = createQueryKeys("bookSale", {
  marketSales: (params: SearchBookSalesParams) => ({
    queryKey: ["market", params],
  }),
  popularSales: {
    queryKey: null,
  },
  mySales: {
    queryKey: null,
  },
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
  recentSales: {
    queryKey: null,
  },
});
