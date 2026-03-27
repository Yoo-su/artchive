/**
 * 독서 기록(Reading Log) API 모듈
 *
 * 이 모듈은 독서 기록 관련 백엔드 API와의 통신을 담당합니다.
 * 모든 API 호출은 인증된 사용자(privateAxios)를 통해 수행됩니다.
 */

import { createReadingLog as sharedCreateReadingLog, deleteReadingLog as sharedDeleteReadingLog, getReadingLogs as sharedGetReadingLogs, getReadingLogSettings as sharedGetReadingLogSettings, getReadingLogsInfinite as sharedGetReadingLogsInfinite, getReadingLogStats as sharedGetReadingLogStats, updateReadingLog as sharedUpdateReadingLog, updateReadingLogSettings as sharedUpdateReadingLogSettings } from "@bookjeok/api-client/reading-log";
import { CreateReadingLogParams, ReadingLog, ReadingLogListResponse, ReadingLogStats, UpdateReadingLogParams } from "@bookjeok/core/reading-log";

import { privateAxios } from "@/shared/libs/axios";

/**
 * 월별 독서 기록을 조회합니다.
 *
 * @param year - 조회할 연도 (YYYY)
 * @param month - 조회할 월 (1-12)
 * @returns 해당 월의 독서 기록 배열
 */
export const getReadingLogs = async (year: number, month: number) => {
  return sharedGetReadingLogs(privateAxios, { year, month });
};

/**
 * 월별/연간 독서 통계를 조회합니다.
 *
 * @param year - 조회할 연도 (YYYY)
 * @param month - 조회할 월 (1-12)
 * @returns 월간/연간 독서 권수 통계
 */
export const getReadingLogStats = async (year: number, month: number) => {
  return sharedGetReadingLogStats(privateAxios, { year, month });
};

/**
 * 독서 기록 설정 타입
 */
export interface ReadingLogSettings {
  /** 독서 기록 공개 여부 (프로필에 표시 여부) */
  isReadingLogPublic: boolean;
}

/**
 * 독서 기록 설정을 조회합니다.
 *
 * @returns 현재 사용자의 독서 기록 설정
 */
export const getReadingLogSettings = async () => {
  return sharedGetReadingLogSettings(privateAxios);
};

/**
 * 독서 기록 설정을 수정합니다.
 *
 * @param isReadingLogPublic - 독서 기록 공개 여부
 * @returns 수정된 독서 기록 설정
 */
export const updateReadingLogSettings = async (isReadingLogPublic: boolean) => {
  return sharedUpdateReadingLogSettings(privateAxios, isReadingLogPublic);
};

/**
 * 독서 기록을 무한 스크롤 방식으로 조회합니다.
 * 커서 기반 페이지네이션을 사용합니다.
 *
 * @param pageParam - 이전 페이지의 마지막 기록 ID (첫 페이지는 null)
 * @param limit - 한 번에 가져올 기록 수 (기본값: 10)
 * @returns 독서 기록 아이템 배열과 다음 커서
 */
export const getReadingLogsInfinite = async ({
  pageParam,
  limit = 10,
}: {
  pageParam?: string | null;
  limit?: number;
}) => {
  // 패키지 쪽 infinite 함수는 파라미터 구조가 약간 다를 수 있으므로 확인 필요
  // 여기서는 기존 로직대로 래핑
  return sharedGetReadingLogsInfinite(privateAxios, pageParam ?? null);
};

/**
 * 새로운 독서 기록을 생성합니다.
 *
 * @param params - 독서 기록 생성에 필요한 정보 (책 정보, 날짜, 메모 등)
 * @returns 생성된 독서 기록
 */
export const createReadingLog = async (params: CreateReadingLogParams) => {
  return sharedCreateReadingLog(privateAxios, params);
};

/**
 * 기존 독서 기록을 수정합니다.
 * 현재는 메모 수정만 지원합니다.
 *
 * @param params - 수정할 기록 ID와 변경할 메모
 * @returns 수정된 독서 기록
 */
export const updateReadingLog = async (params: UpdateReadingLogParams) => {
  return sharedUpdateReadingLog(privateAxios, params);
};

/**
 * 독서 기록을 삭제합니다.
 *
 * @param id - 삭제할 독서 기록 ID
 * @returns 삭제 결과
 */
export const deleteReadingLog = async (id: string) => {
  return sharedDeleteReadingLog(privateAxios, id);
};
