"use client";

import {
  createReadingLog,
  deleteReadingLog,
  updateReadingLog,
  updateReadingLogSettings,
} from "@bookjeok/api-client";
import {
  CreateReadingLogParams,
  ReadingLog,
  readingLogKeys,
  UpdateReadingLogParams,
  User,
  userKeys,
} from "@bookjeok/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 독서 기록 설정 수정 뮤테이션
 */
export const useUpdateReadingLogSettingsMutation = (
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isReadingLogPublic: boolean) =>
      updateReadingLogSettings(isReadingLogPublic),
    onMutate: async (isReadingLogPublic) => {
      await queryClient.cancelQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });
      await queryClient.cancelQueries({ queryKey: userKeys.me.queryKey });

      const previousSettings = queryClient.getQueryData(
        readingLogKeys.settings.queryKey,
      );
      const previousUser = queryClient.getQueryData<User>(userKeys.me.queryKey);

      queryClient.setQueryData<{ isReadingLogPublic: boolean }>(
        readingLogKeys.settings.queryKey,
        (old) => (old ? { ...old, isReadingLogPublic } : { isReadingLogPublic }),
      );

      if (previousUser) {
        queryClient.setQueryData(userKeys.me.queryKey, {
          ...previousUser,
          isReadingLogPublic,
        });
      }

      return { previousSettings, previousUser };
    },
    onError: (err, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(
          readingLogKeys.settings.queryKey,
          context.previousSettings,
        );
      }
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.me.queryKey, context.previousUser);
      }
      options?.onError?.(err);
    },
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: readingLogKeys.settings.queryKey,
      });
      queryClient.invalidateQueries({ queryKey: userKeys.me.queryKey });
    },
  });
};

/**
 * 독서 기록 생성 뮤테이션
 */
export const useCreateReadingLogMutation = (
  options?: {
    onSuccess?: (data: ReadingLog) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation<
    ReadingLog,
    Error,
    CreateReadingLogParams & { idempotencyKey?: string }
  >({
    mutationFn: ({
      idempotencyKey,
      ...payload
    }: CreateReadingLogParams & { idempotencyKey?: string }) =>
      createReadingLog(payload as CreateReadingLogParams, {
        idempotencyKey,
      }),
    onSuccess: (data) => {
      if (data.date) {
        const [yearStr, monthStr] = data.date.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        queryClient.setQueryData<ReadingLog[]>(
          readingLogKeys.list({ year, month }).queryKey,
          (old) => {
            if (!old) return [data];
            return [...old, data].sort((a, b) => a.date.localeCompare(b.date));
          },
        );
      }
      // 동기화를 위해 백그라운드로 캐시 전체 무효화
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 독서 기록 수정 뮤테이션
 */
export const useUpdateReadingLogMutation = (
  options?: {
    onSuccess?: (data: ReadingLog) => void;
    onError?: (error: unknown) => void;
  },
) => {
  const queryClient = useQueryClient();

  return useMutation<ReadingLog, Error, UpdateReadingLogParams>({
    mutationFn: (params: UpdateReadingLogParams) =>
      updateReadingLog(params),
    onSuccess: (data) => {
      if (data.date) {
        const [yearStr, monthStr] = data.date.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        queryClient.setQueryData<ReadingLog[]>(
          readingLogKeys.list({ year, month }).queryKey,
          (old) => {
            if (!old) return [data];
            return old
              .map((log) => (log.id === data.id ? data : log))
              .sort((a, b) => a.date.localeCompare(b.date));
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * 독서 기록 삭제 뮤테이션
 */
export const useDeleteReadingLogMutation = (
  options?: { onSuccess?: () => void; onError?: (error: unknown) => void },
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string; date: string }) =>
      deleteReadingLog(params.id),
    onSuccess: (_, variables) => {
      if (variables.date) {
        const [yearStr, monthStr] = variables.date.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);

        queryClient.setQueryData<ReadingLog[]>(
          readingLogKeys.list({ year, month }).queryKey,
          (old) => {
            if (!old) return old;
            return old.filter((log) => log.id !== variables.id);
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: readingLogKeys._def });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
};
