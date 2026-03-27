import { API_PATHS } from "@bookjeok/core";
import { CreateReadingLogParams, ReadingLog, ReadingLogListResponse, ReadingLogStats, UpdateReadingLogParams } from "@bookjeok/core/reading-log";
import { AxiosInstance } from "axios";

/**
 * 독서 기록 목록을 조회합니다.
 */
export const getReadingLogs = async (
  client: AxiosInstance,
  params: { year?: number; month?: number },
): Promise<ReadingLog[]> => {
  const { data } = await client.get<ReadingLog[]>(API_PATHS.readingLog.base, {
    params,
  });
  return data;
};

/**
 * 독서 기록 목록을 무한 스크롤로 조회합니다.
 */
export const getReadingLogsInfinite = async (
  client: AxiosInstance,
  pageParam: string | null = null,
): Promise<ReadingLogListResponse> => {
  const { data } = await client.get<ReadingLogListResponse>(
    API_PATHS.readingLog.list,
    {
      params: { cursorId: pageParam },
    },
  );
  return data;
};

/**
 * 독서 기록을 생성합니다.
 */
export const createReadingLog = async (
  client: AxiosInstance,
  payload: CreateReadingLogParams,
): Promise<ReadingLog> => {
  const response = await client.post<ReadingLog>(
    API_PATHS.readingLog.base,
    payload,
  );
  return response.data;
};

/**
 * 독서 기록을 수정합니다.
 */
export const updateReadingLog = async (
  client: AxiosInstance,
  { id, memo }: UpdateReadingLogParams,
): Promise<ReadingLog> => {
  const response = await client.patch<ReadingLog>(
    API_PATHS.readingLog.detail(id),
    { memo },
  );
  return response.data;
};

/**
 * 독서 기록을 삭제합니다.
 */
export const deleteReadingLog = async (
  client: AxiosInstance,
  id: string,
): Promise<void> => {
  await client.delete(API_PATHS.readingLog.detail(id));
};

/**
 * 독서 기록 통계를 조회합니다.
 */
export const getReadingLogStats = async (
  client: AxiosInstance,
  params: { year: number; month: number },
): Promise<ReadingLogStats> => {
  const response = await client.get<ReadingLogStats>(
    API_PATHS.readingLog.stats,
    { params },
  );
  return response.data;
};

/**
 * 독서 기록 설정을 조회합니다.
 */
export const getReadingLogSettings = async (
  client: AxiosInstance,
): Promise<{ isReadingLogPublic: boolean }> => {
  const response = await client.get<{ isReadingLogPublic: boolean }>(
    API_PATHS.readingLog.settings,
  );
  return response.data;
};

/**
 * 독서 기록 설정을 수정합니다.
 */
export const updateReadingLogSettings = async (
  client: AxiosInstance,
  isReadingLogPublic: boolean,
): Promise<{ isReadingLogPublic: boolean }> => {
  const response = await client.patch<{ isReadingLogPublic: boolean }>(
    API_PATHS.readingLog.settings,
    {
      isReadingLogPublic,
    },
  );
  return response.data;
};
