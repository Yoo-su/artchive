import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios, publicAxios } from "@/shared/libs/axios";

import {
  CommonBookSaleResponse,
  CreateBookSaleParams,
  GetMyBookSalesResponse,
  GetRelatedSalesParams,
  GetRelatedSalesResponse,
  SaleStatus,
  SearchBookSalesParams,
  SearchBookSalesResponse,
  UpdateBookSaleParams,
  UsedBookSale,
} from "../types";

/**
 * 중고책 판매글을 등록합니다.
 */
export const createBookSale = async (
  payload: CreateBookSaleParams,
): Promise<CommonBookSaleResponse> => {
  const { data } = await privateAxios.post<CommonBookSaleResponse>(
    API_PATHS.book.sale,
    payload,
  );
  return data;
};

/**
 * 내가 등록한 중고책 판매글 목록을 조회합니다.
 */
export const getMyBookSales = async (): Promise<GetMyBookSalesResponse> => {
  const { data } = await privateAxios.get<GetMyBookSalesResponse>(
    API_PATHS.book.mySales,
  );
  return data;
};

/**
 * 중고책 판매글의 상태(판매중, 예약중, 판매완료)를 변경합니다.
 */
export const updateBookSaleStatus = async ({
  saleId,
  status,
}: {
  saleId: number;
  status: SaleStatus;
}): Promise<CommonBookSaleResponse> => {
  const { data } = await privateAxios.patch<CommonBookSaleResponse>(
    API_PATHS.book.saleStatus(saleId),
    { status },
  );
  return data;
};

/**
 * 특정 판매글의 상세 정보를 조회합니다.
 */
export const getBookSaleDetail = async (saleId: string) => {
  const { data } = await publicAxios.get<UsedBookSale>(
    API_PATHS.book.saleDetail(saleId),
  );
  return data;
};

/**
 * 수정을 위한 판매글 조회 (본인 글만 조회 가능)
 */
export const getSaleForEdit = async (
  saleId: string | number,
): Promise<UsedBookSale> => {
  const { data } = await privateAxios.get<UsedBookSale>(
    API_PATHS.book.saleForEdit(saleId),
  );
  return data;
};

/**
 * 특정 책(ISBN)에 대한 관련 판매글 목록을 페이지네이션으로 조회합니다.
 */
export const getRelatedSales = async ({
  isbn,
  page,
  limit,
  city,
  district,
}: GetRelatedSalesParams): Promise<GetRelatedSalesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (city) params.append("city", city);
  if (district) params.append("district", district);

  const { data } = await publicAxios.get<GetRelatedSalesResponse>(
    API_PATHS.book.relatedSales(isbn),
    { params },
  );
  return data;
};

/**
 * 중고책 판매글을 수정합니다.
 */
export const updateBookSale = async ({
  saleId,
  payload,
}: {
  saleId: number;
  payload: UpdateBookSaleParams;
}) => {
  const { data } = await privateAxios.patch<CommonBookSaleResponse>(
    API_PATHS.book.updateSale(saleId),
    payload,
  );
  return data;
};

/**
 * 중고책 판매글을 삭제합니다.
 */
export const deleteBookSale = async (saleId: number) => {
  await privateAxios.delete(API_PATHS.book.deleteSale(saleId));
};

/**
 * 최근 등록된 중고책 판매글 목록을 조회합니다.
 */
export const getRecentBookSales = async (): Promise<UsedBookSale[]> => {
  const { data } = await publicAxios.get<UsedBookSale[]>(
    API_PATHS.book.recentSales,
  );
  return data;
};

/**
 * 인기 판매글 목록을 조회합니다.
 */
export const getPopularBookSales = async (): Promise<UsedBookSale[]> => {
  const { data } = await publicAxios.get<UsedBookSale[]>(
    API_PATHS.book.popularSales,
  );
  return data;
};

/**
 * 중고책 판매글을 검색합니다.
 */
export const searchBookSales = async (
  params: SearchBookSalesParams,
): Promise<SearchBookSalesResponse> => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const queryString = queryParams.toString();
  const url = queryString
    ? `${API_PATHS.book.sales}?${queryString}`
    : API_PATHS.book.sales;

  const { data } = await publicAxios.get<SearchBookSalesResponse>(url);
  return data;
};
