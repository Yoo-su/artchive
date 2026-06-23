import { ActiveReadersResponse,API_PATHS, CreateReadingLogParams, LoungeBookReadersResponse, LoungeFeedResponse, LoungePopularResponse, ReadingLog, ReadingLogListResponse, ReadingLogStats, UpdateReadingLogParams } from "@bookjeok/core";
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
  options?: { idempotencyKey?: string },
): Promise<ReadingLog> => {
  const config = options?.idempotencyKey ? { headers: { 'x-idempotency-key': options.idempotencyKey } } : undefined;
  const response = await client.post<ReadingLog>(
    API_PATHS.readingLog.base,
    payload,
    config
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

/**
 * 라운지 피드를 조회합니다. (공개 API - 인증 불필요)
 * 모든 공개 사용자의 독서 기록을 책 단위로 그룹화하여 반환합니다.
 */
export const getLoungeFeed = async (
  client: AxiosInstance,
  cursor: string | null = null,
): Promise<LoungeFeedResponse> => {
  const { data } = await client.get<LoungeFeedResponse>(
    API_PATHS.readingLog.loungeFeed,
    {
      params: { cursor },
    },
  );
  return data;
};

/**
 * 라운지 인기 도서를 조회합니다. (공개 API - 인증 불필요)
 * 최근 30일간 가장 많이 읽힌 도서 Top 10을 반환합니다.
 */
export const getLoungePopular = async (
  client: AxiosInstance,
): Promise<LoungePopularResponse> => {
  const { data } = await client.get<LoungePopularResponse>(
    API_PATHS.readingLog.loungePopular,
  );
  return data;
};

/**
 * 라운지 열성 독서가 목록을 조회합니다. (공개 API - 인증 불필요)
 */
export const getLoungeActiveReaders = async (
  client: AxiosInstance,
): Promise<ActiveReadersResponse> => {
  const { data } = await client.get<ActiveReadersResponse>(
    API_PATHS.readingLog.loungeActiveReaders,
  );
  return data;
};

/**
 * 특정 도서의 전체 독자 목록을 조회합니다. (공개 API - 인증 불필요)
 * 상세 모달에서 무한 스크롤로 사용됩니다.
 */
export const getLoungeBookReaders = async (
  client: AxiosInstance,
  isbn: string,
  cursor: string | null = null,
): Promise<LoungeBookReadersResponse> => {
  const { data } = await client.get<LoungeBookReadersResponse>(
    API_PATHS.readingLog.loungeBookReaders(isbn),
    {
      params: { cursor },
    },
  );
  return data;
};
