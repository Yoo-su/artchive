import { API_PATHS, getSimpleDate } from "@bookjeok/core";
import { ArtItem, ArtListErrorResponse, ArtListSuccessResponse, DEFAULT_CITY_CODE,DEFAULT_PAGE, DEFAULT_PRFSTATE, DEFAULT_ROWS, GetArtDetailResponse, GetArtListParams } from "@bookjeok/core/art";
import { AxiosInstance } from "axios";

/**
 * 공연/예술 목록을 조회합니다.
 */
export const getArtList = async (
  client: AxiosInstance,
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
  const { data } = await client.get(url);

  return data;
};

/**
 * 공연/예술 상세 정보 조회 API
 * @param artId - 공연 ID (mt20id)
 */
export const getArtDetail = async (
  client: AxiosInstance,
  artId: string,
): Promise<GetArtDetailResponse> => {
  const { data } = await client.get(API_PATHS.art.detail(artId));
  return data;
};
