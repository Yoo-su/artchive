import { API_PATHS, ArtItem, ArtListErrorResponse, ArtListSuccessResponse, DEFAULT_CITY_CODE, DEFAULT_PAGE, DEFAULT_PRFSTATE, DEFAULT_ROWS, GetArtDetailResponse, GetArtListParams, getSimpleDate } from "@bookjeok/core";

import { publicApiClient } from "../../client";

/**
 * 공연/예술 목록을 조회합니다.
 */
export const getArtList = async (
  params: GetArtListParams,
): Promise<ArtListSuccessResponse | ArtListErrorResponse> => {
  const searchParams = new URLSearchParams();

  const now = new Date();
  // 기본값: 한 달 전 ~ 한 달 후
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 1);

  const defaultEnd = new Date(now);
  defaultEnd.setMonth(defaultEnd.getMonth() + 1);

  const startDateStr = params.startDate ?? getSimpleDate(defaultStart);
  const endDateStr = params.endDate ?? getSimpleDate(defaultEnd);

  searchParams.set("cpage", params.cpage ?? DEFAULT_PAGE);
  searchParams.set("rows", params.rows ?? DEFAULT_ROWS);
  searchParams.set("prfstate", params.prfstate ?? DEFAULT_PRFSTATE);
  searchParams.set("genreCode", params.genreCode);
  searchParams.set("startDate", startDateStr);
  searchParams.set("endDate", endDateStr);
  searchParams.set("signgucode", params.signgucode ?? DEFAULT_CITY_CODE);

  const url = `${API_PATHS.art.list}?${searchParams.toString()}`;
  const { data } = await publicApiClient.get(url);

  return data;
};

/**
 * 공연/예술 목록을 직접 조회합니다. (Expo 등 외부 연동용)
 */
export const getExternalArtList = async (
  params: GetArtListParams,
): Promise<ArtListSuccessResponse | ArtListErrorResponse> => {
  const searchParams = new URLSearchParams();

  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setMonth(defaultStart.getMonth() - 1);

  const defaultEnd = new Date(now);
  defaultEnd.setMonth(defaultEnd.getMonth() + 1);

  const startDateStr = params.startDate ?? getSimpleDate(defaultStart);
  const endDateStr = params.endDate ?? getSimpleDate(defaultEnd);

  searchParams.set("cpage", params.cpage ?? DEFAULT_PAGE);
  searchParams.set("rows", params.rows ?? DEFAULT_ROWS);
  searchParams.set("prfstate", params.prfstate ?? DEFAULT_PRFSTATE);
  searchParams.set("genreCode", params.genreCode);
  searchParams.set("startDate", startDateStr);
  searchParams.set("endDate", endDateStr);
  searchParams.set("signgucode", params.signgucode ?? DEFAULT_CITY_CODE);

  const url = `${API_PATHS.art.externalList}?${searchParams.toString()}`;
  const { data } = await publicApiClient.get(url);

  return data;
};

/**
 * 공연/예술 상세 정보 조회 API
 * @param artId - 공연 ID (mt20id)
 */
export const getArtDetail = async (
  artId: string,
): Promise<GetArtDetailResponse> => {
  const { data } = await publicApiClient.get(API_PATHS.art.detail(artId));
  return data;
};

/**
 * 공연/예술 상세 정보 조회 API (Expo 등 외부 연동용)
 * @param artId - 공연 ID (mt20id)
 */
export const getExternalArtDetail = async (
  artId: string,
): Promise<GetArtDetailResponse> => {
  const { data } = await publicApiClient.get(API_PATHS.art.externalDetail(artId));
  return data;
};
