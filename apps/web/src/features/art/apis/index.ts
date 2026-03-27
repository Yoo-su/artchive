import { getArtDetail as sharedGetArtDetail, getArtList as sharedGetArtList } from "@bookjeok/api-client/art";
import { ArtListErrorResponse, ArtListSuccessResponse, GetArtDetailResponse, GetArtListParams } from "@bookjeok/core/art";

import { internalAxios } from "@/shared/libs/axios";

/**
 * 공연/예술 목록을 조회합니다.
 * @param params 조회 파라미터 (페이지, 장르, 날짜 등)
 * @returns 공연 목록 또는 에러 응답
 */
export const getArtList = async (
  params: GetArtListParams,
): Promise<ArtListSuccessResponse | ArtListErrorResponse> => {
  return sharedGetArtList(internalAxios, params);
};

/**
 * 공연/예술 상세 정보 조회 API
 * @param artId - 공연 ID (mt20id)
 */
export const getArtDetail = async (
  artId: string,
): Promise<GetArtDetailResponse> => {
  return sharedGetArtDetail(internalAxios, artId);
};
