import { SearchBookSalesParams, UseInfiniteRelatedSalesQueryProps } from "@bookjeok/core";
import { useBookSaleDetailQuery as useBaseBookSaleDetailQuery, useBookSaleForEditQuery as useBaseBookSaleForEditQuery, useInfiniteBookSalesQuery as useBaseInfiniteBookSalesQuery, useInfiniteRelatedSalesQuery as useBaseInfiniteRelatedSalesQuery, useMyBookSalesQuery as useBaseMyBookSalesQuery, usePopularBookSalesQuery as useBasePopularBookSalesQuery, useRecentBookSalesQuery as useBaseRecentBookSalesQuery, useRelatedSalesQuery as useBaseRelatedSalesQuery } from "@bookjeok/react-query";

export type { SaleStatus as BookSaleStatus, UsedBookSale } from "@bookjeok/core";

export const useInfiniteBookSalesQuery = (params: SearchBookSalesParams) =>
  useBaseInfiniteBookSalesQuery(params);

export const useMyBookSalesQuery = () => useBaseMyBookSalesQuery();

export const useBookSaleDetailQuery = (saleId: string) =>
  useBaseBookSaleDetailQuery(saleId);

export const useBookSaleForEditQuery = (saleId: string) =>
  useBaseBookSaleForEditQuery(saleId);

export const useInfiniteRelatedSalesQuery = (
  props: UseInfiniteRelatedSalesQueryProps,
) => useBaseInfiniteRelatedSalesQuery(props);

export const useRelatedSalesQuery = (props: {
  isbn: string;
  limit?: number;
  enabled?: boolean;
}) => useBaseRelatedSalesQuery(props);

export const useRecentBookSalesQuery = (limit: number = 25) =>
  useBaseRecentBookSalesQuery(limit);

export const usePopularBookSalesQuery = () =>
  useBasePopularBookSalesQuery();

