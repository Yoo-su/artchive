"use client";
import { recordSearchKeyword } from "@bookjeok/api-client";
import { useMutation } from "@tanstack/react-query";

/**
 * 검색어를 기록하는 뮤테이션 훅
 * 인기 검색어 집계에 사용됩니다. (fire-and-forget 방식)
 */
export const useRecordSearchKeywordMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: (keyword: string) => recordSearchKeyword(keyword),
    // 에러가 발생해도 사용자에게 알리지 않음 (UX 방해 금지)
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to record search keyword:", error);
      options?.onError?.(error);
    },
  });
};
