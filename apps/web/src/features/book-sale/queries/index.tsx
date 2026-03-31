import { SearchBookSalesParams, UseInfiniteRelatedSalesQueryProps } from "@bookjeok/core";
import { useBookSaleDetailQuery as useBaseBookSaleDetailQuery, useBookSaleForEditQuery as useBaseBookSaleForEditQuery, useInfiniteBookSalesQuery as useBaseInfiniteBookSalesQuery, useInfiniteRelatedSalesQuery as useBaseInfiniteRelatedSalesQuery, useMyBookSalesQuery as useBaseMyBookSalesQuery, usePopularBookSalesQuery as useBasePopularBookSalesQuery, useRecentBookSalesQuery as useBaseRecentBookSalesQuery, useRelatedSalesQuery as useBaseRelatedSalesQuery } from "@bookjeok/react-query";

import { privateAxios, publicAxios } from "@/shared/libs/axios";

export type { SaleStatus as BookSaleStatus, UsedBookSale } from "@bookjeok/core";

export const useInfiniteBookSalesQuery = (params: SearchBookSalesParams) =>
  useBaseInfiniteBookSalesQuery(params, publicAxios);

export const useMyBookSalesQuery = () => useBaseMyBookSalesQuery(privateAxios);

export const useBookSaleDetailQuery = (saleId: string) =>
  useBaseBookSaleDetailQuery(saleId, publicAxios);

export const useBookSaleForEditQuery = (saleId: string) =>
  useBaseBookSaleForEditQuery(saleId, privateAxios);

export const useInfiniteRelatedSalesQuery = (
  props: UseInfiniteRelatedSalesQueryProps,
) => useBaseInfiniteRelatedSalesQuery({ ...props, client: publicAxios });

export const useRelatedSalesQuery = (props: {
  isbn: string;
  limit?: number;
  enabled?: boolean;
}) => useBaseRelatedSalesQuery({ ...props, client: publicAxios });

export const useRecentBookSalesQuery = () =>
  useBaseRecentBookSalesQuery(publicAxios);

export const usePopularBookSalesQuery = () =>
  useBasePopularBookSalesQuery(publicAxios);

