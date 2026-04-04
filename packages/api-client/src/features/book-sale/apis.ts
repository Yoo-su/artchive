import { API_PATHS, CommonBookSaleResponse, CreateBookSaleParams, GetMyBookSalesResponse, GetRelatedSalesParams, GetRelatedSalesResponse, SaleStatus, SearchBookSalesParams, SearchBookSalesResponse, UpdateBookSaleParams, UsedBookSale } from "@bookjeok/core";
import { AxiosInstance } from "axios";

/**
 * 중고책 판매글을 등록합니다.
 */
export const createBookSale = async (
  client: AxiosInstance,
  params: CreateBookSaleParams,
  options?: { idempotencyKey?: string },
): Promise<UsedBookSale> => {
  const config = options?.idempotencyKey ? { headers: { 'x-idempotency-key': options.idempotencyKey } } : undefined;
  const { data } = await client.post<UsedBookSale>(
    API_PATHS.book.sale,
    params,
    config
  );
  return data;
};

/**
 * 내가 등록한 중고책 판매글 목록을 조회합니다.
 */
export const getMyBookSales = async (
  client: AxiosInstance,
): Promise<GetMyBookSalesResponse> => {
  const { data } = await client.get<GetMyBookSalesResponse>(
    API_PATHS.book.mySales,
  );
  return data;
};

/**
 * 중고책 판매글의 상태를 변경합니다.
 */
export const updateBookSaleStatus = async (
  client: AxiosInstance,
  { saleId, status }: { saleId: number; status: SaleStatus },
): Promise<CommonBookSaleResponse> => {
  const { data } = await client.patch<CommonBookSaleResponse>(
    API_PATHS.book.saleStatus(saleId),
    { status },
  );
  return data;
};

/**
 * 특정 판매글의 상세 정보를 조회합니다.
 */
export const getBookSaleDetail = async (client: AxiosInstance, saleId: string) => {
  const { data } = await client.get<UsedBookSale>(
    API_PATHS.book.saleDetail(saleId),
  );
  return data;
};

/**
 * 수정을 위한 판매글 조회
 */
export const getSaleForEdit = async (
  client: AxiosInstance,
  saleId: string | number,
): Promise<UsedBookSale> => {
  const { data } = await client.get<UsedBookSale>(
    API_PATHS.book.saleForEdit(saleId),
  );
  return data;
};

/**
 * 관련 판매글 목록을 페이지네이션으로 조회합니다.
 */
export const getRelatedSales = async (
  client: AxiosInstance,
  { isbn, page, limit, city, district }: GetRelatedSalesParams,
): Promise<GetRelatedSalesResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (city) params.append("city", city);
  if (district) params.append("district", district);

  const { data } = await client.get<GetRelatedSalesResponse>(
    API_PATHS.book.relatedSales(isbn),
    { params },
  );
  return data;
};

/**
 * 중고책 판매글을 수정합니다.
 */
export const updateBookSale = async (
  client: AxiosInstance,
  { saleId, payload }: { saleId: number; payload: UpdateBookSaleParams },
) => {
  const { data } = await client.patch<CommonBookSaleResponse>(
    API_PATHS.book.updateSale(saleId),
    payload,
  );
  return data;
};

/**
 * 중고책 판매글을 삭제합니다.
 */
export const deleteBookSale = async (client: AxiosInstance, saleId: number) => {
  await client.delete(API_PATHS.book.deleteSale(saleId));
};

/**
 * 최근 등록된 중고책 판매글 목록을 조회합니다.
 */
export const getRecentBookSales = async (
  client: AxiosInstance,
): Promise<UsedBookSale[]> => {
  const { data } = await client.get<UsedBookSale[]>(API_PATHS.book.recentSales);
  return data;
};

/**
 * 인기 판매글 목록을 조회합니다.
 */
export const getPopularBookSales = async (
  client: AxiosInstance,
): Promise<UsedBookSale[]> => {
  const { data } = await client.get<UsedBookSale[]>(API_PATHS.book.popularSales);
  return data;
};

/**
 * 중고책 판매글을 검색합니다.
 */
export const getBookSales = async (
  client: AxiosInstance,
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

  const { data } = await client.get<SearchBookSalesResponse>(url);
  return data;
};
