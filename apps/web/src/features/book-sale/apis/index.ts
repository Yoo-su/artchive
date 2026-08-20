import { createBookSale as sharedCreateBookSale, deleteBookSale as sharedDeleteBookSale, getBookSaleDetail as sharedGetBookSaleDetail, getBookSales as sharedSearchBookSales, getMyBookSales as sharedGetMyBookSales, getPopularBookSales as sharedGetPopularBookSales, getRecentBookSales as sharedGetRecentBookSales, getRelatedSales as sharedGetRelatedSales, getSaleForEdit as sharedGetSaleForEdit, recordSaleView as sharedRecordSaleView, updateBookSale as sharedUpdateBookSale, updateBookSaleStatus as sharedUpdateBookSaleStatus } from "@bookjeok/api-client";
import { CommonBookSaleResponse, CreateBookSaleParams, GetMyBookSalesResponse, GetRelatedSalesParams, GetRelatedSalesResponse, SaleStatus, SearchBookSalesParams, SearchBookSalesResponse, UpdateBookSaleParams, UsedBookSale } from "@bookjeok/core";

/**
 * 중고책 판매글을 등록합니다.
 */
export const createBookSale = async (
  payload: CreateBookSaleParams,
): Promise<CommonBookSaleResponse> => {
  return sharedCreateBookSale(payload);
};

/**
 * 내가 등록한 중고책 판매글 목록을 조회합니다.
 */
export const getMyBookSales = async (): Promise<GetMyBookSalesResponse> => {
  return sharedGetMyBookSales();
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
  return sharedUpdateBookSaleStatus({ saleId, status });
};

/**
 * 특정 판매글의 상세 정보를 조회합니다.
 */
export const getBookSaleDetail = async (saleId: string) => {
  return sharedGetBookSaleDetail(saleId);
};

/**
 * 수정을 위한 판매글 조회 (본인 글만 조회 가능)
 */
export const getSaleForEdit = async (
  saleId: string | number,
): Promise<UsedBookSale> => {
  return sharedGetSaleForEdit(saleId);
};

/**
 * 특정 책(ISBN)에 대한 관련 판매글 목록을 페이지네이션으로 조회합니다.
 */
export const getRelatedSales = async (
  params: GetRelatedSalesParams,
): Promise<GetRelatedSalesResponse> => {
  return sharedGetRelatedSales(params);
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
  return sharedUpdateBookSale({ saleId, payload });
};

/**
 * 중고책 판매글을 삭제합니다.
 */
export const deleteBookSale = async (saleId: number) => {
  return sharedDeleteBookSale(saleId);
};

/**
 * 최근 등록된 중고책 판매글 목록을 조회합니다.
 */
export const getRecentBookSales = async (
  limit: number = 25,
): Promise<UsedBookSale[]> => {
  return sharedGetRecentBookSales(limit);
};

/**
 * 인기 판매글 목록을 조회합니다.
 */
export const getPopularBookSales = async (): Promise<UsedBookSale[]> => {
  return sharedGetPopularBookSales();
};

/**
 * 중고책 판매글을 검색합니다.
 */
export const getBookSales = async (
  params: SearchBookSalesParams,
): Promise<SearchBookSalesResponse> => {
  return sharedSearchBookSales(params);
};

/**
 * 중고책 판매글 상세페이지 조회수를 기록합니다.
 */
export const recordSaleView = async (saleId: number): Promise<void> => {
  return sharedRecordSaleView(saleId);
};
