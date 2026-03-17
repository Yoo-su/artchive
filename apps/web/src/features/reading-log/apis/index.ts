/**
 * 독서 기록(Reading Log) API 모듈
 *
 * 이 모듈은 독서 기록 관련 백엔드 API와의 통신을 담당합니다.
 * 모든 API 호출은 인증된 사용자(privateAxios)를 통해 수행됩니다.
 */

import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios } from "@/shared/libs/axios";

import {
  CreateReadingLogParams,
  ReadingLog,
  ReadingLogListResponse,
  ReadingLogStats,
  UpdateReadingLogParams,
} from "../types";

/**
 * 월별 독서 기록을 조회합니다.
 *
 * @param year - 조회할 연도 (YYYY)
 * @param month - 조회할 월 (1-12)
 * @returns 해당 월의 독서 기록 배열
 *
 * @example
 * const logs = await getReadingLogs(2024, 1);
 */
export const getReadingLogs = async (year: number, month: number) => {
  const response = await privateAxios.get<ReadingLog[]>(
    API_PATHS.readingLog.base,
    {
      params: { year, month },
    }
  );
  return response.data;
};

/**
 * 월별/연간 독서 통계를 조회합니다.
 *
 * @param year - 조회할 연도 (YYYY)
 * @param month - 조회할 월 (1-12)
 * @returns 월간/연간 독서 권수 통계
 *
 * @example
 * const stats = await getReadingLogStats(2024, 1);
 * // { monthlyCount: 5, yearlyCount: 12 }
 */
export const getReadingLogStats = async (year: number, month: number) => {
  const response = await privateAxios.get<ReadingLogStats>(
    API_PATHS.readingLog.stats,
    {
      params: { year, month },
    }
  );
  return response.data;
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
 *
 * @example
 * const settings = await getReadingLogSettings();
 * // { isReadingLogPublic: true }
 */
export const getReadingLogSettings = async () => {
  const response = await privateAxios.get<ReadingLogSettings>(
    API_PATHS.readingLog.settings
  );
  return response.data;
};

/**
 * 독서 기록 설정을 수정합니다.
 *
 * @param isReadingLogPublic - 독서 기록 공개 여부
 * @returns 수정된 독서 기록 설정
 *
 * @example
 * const settings = await updateReadingLogSettings(true);
 */
export const updateReadingLogSettings = async (isReadingLogPublic: boolean) => {
  const response = await privateAxios.patch<ReadingLogSettings>(
    API_PATHS.readingLog.settings,
    { isReadingLogPublic }
  );
  return response.data;
};

/**
 * 독서 기록을 무한 스크롤 방식으로 조회합니다.
 * 커서 기반 페이지네이션을 사용합니다.
 *
 * @param pageParam - 이전 페이지의 마지막 기록 ID (첫 페이지는 null)
 * @param limit - 한 번에 가져올 기록 수 (기본값: 10)
 * @returns 독서 기록 아이템 배열과 다음 커서
 *
 * @example
 * const { items, nextCursor } = await getReadingLogsInfinite({ pageParam: null, limit: 10 });
 */
export const getReadingLogsInfinite = async ({
  pageParam,
  limit = 10,
}: {
  pageParam?: string | null;
  limit?: number;
}) => {
  const response = await privateAxios.get<ReadingLogListResponse>(
    API_PATHS.readingLog.list,
    {
      params: { cursorId: pageParam, limit },
    }
  );
  return response.data;
};

/**
 * 새로운 독서 기록을 생성합니다.
 *
 * @param params - 독서 기록 생성에 필요한 정보 (책 정보, 날짜, 메모 등)
 * @returns 생성된 독서 기록
 *
 * @example
 * const newLog = await createReadingLog({
 *   bookIsbn: "1234567890",
 *   bookTitle: "책 제목",
 *   date: "2024-01-15",
 *   memo: "재미있었다",
 * });
 */
export const createReadingLog = async (params: CreateReadingLogParams) => {
  const response = await privateAxios.post<ReadingLog>(
    API_PATHS.readingLog.base,
    params
  );
  return response.data;
};

/**
 * 기존 독서 기록을 수정합니다.
 * 현재는 메모 수정만 지원합니다.
 *
 * @param params - 수정할 기록 ID와 변경할 메모
 * @returns 수정된 독서 기록
 *
 * @example
 * const updatedLog = await updateReadingLog({
 *   id: "uuid-1234",
 *   memo: "다시 읽어봐야겠다",
 * });
 */
export const updateReadingLog = async (params: UpdateReadingLogParams) => {
  const response = await privateAxios.patch<ReadingLog>(
    API_PATHS.readingLog.detail(params.id),
    { memo: params.memo }
  );
  return response.data;
};

/**
 * 독서 기록을 삭제합니다.
 *
 * @param id - 삭제할 독서 기록 ID
 * @returns 삭제 결과
 *
 * @example
 * await deleteReadingLog("uuid-1234");
 */
export const deleteReadingLog = async (id: string) => {
  const response = await privateAxios.delete(API_PATHS.readingLog.detail(id));
  return response.data;
};
