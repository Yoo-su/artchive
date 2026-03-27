import { createBookSale, deleteBookSale, updateBookSale, updateBookSaleStatus } from "@bookjeok/api-client/book-sale";
import { CreateBookSaleParams, SaleStatus, UpdateBookSaleParams, UsedBookSale } from "@bookjeok/core/book-sale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosInstance } from "axios";

import { bookSaleKeys } from "./query-keys";

/**
 * 중고책 판매글 생성을 위한 순수 뮤테이션 훅
 */
export const useCreateBookSaleMutation = (client: AxiosInstance, options?: { onSuccess?: (data: UsedBookSale) => void; onError?: (error: Error) => void }) => {
  return useMutation({
    mutationFn: (params: CreateBookSaleParams) => createBookSale(client, params),
    ...options,
  });
};

/**
 * 중고책 판매글 수정을 위한 순수 뮤테이션 훅
 */
export const useUpdateBookSaleMutation = (client: AxiosInstance, options?: { onSuccess?: (data: UsedBookSale) => void; onError?: (error: Error) => void }) => {
  return useMutation({
    mutationFn: (params: { saleId: number; payload: UpdateBookSaleParams }) => 
      updateBookSale(client, params),
    ...options,
  });
};

/**
 * 판매글 상태 업데이트를 위한 순수 뮤테이션 훅 (낙관적 업데이트 포함)
 */
export const useUpdateBookSaleStatusMutation = (client: AxiosInstance, options?: { onSuccess?: (data: UsedBookSale) => void; onError?: (error: Error) => void }) => {
  const queryClient = useQueryClient();
  const queryKey = bookSaleKeys.mySales.queryKey;

  return useMutation({
    mutationFn: (params: { saleId: number; status: SaleStatus }) => 
      updateBookSaleStatus(client, params),
    onMutate: async ({ saleId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<UsedBookSale[]>(queryKey);

      queryClient.setQueryData<UsedBookSale[]>(queryKey, (old) =>
        old
          ? old.map((sale) => (sale.id === saleId ? { ...sale, status } : sale))
          : [],
      );

      return { previousSales };
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    },
    onSuccess: (data: UsedBookSale) => {
      options?.onSuccess?.(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
  });
};

/**
 * 중고책 판매글 삭제를 위한 순수 뮤테이션 훅
 */
export const useDeleteBookSaleMutation = (client: AxiosInstance, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
  return useMutation({
    mutationFn: (saleId: number) => deleteBookSale(client, saleId),
    ...options,
  });
};
