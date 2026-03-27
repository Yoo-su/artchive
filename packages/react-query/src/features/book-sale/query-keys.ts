import { SearchBookSalesParams, UseInfiniteRelatedSalesQueryProps } from "@bookjeok/core/book-sale";
import { createQueryKeys } from "@lukemorales/query-key-factory";

/**
 * 중고책 판매 관련 쿼리 키 팩토리
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
