"use client";

import { useMutation } from "@tanstack/react-query";

import { publicAxios } from "@/shared/libs/axios";

import { recordSearchKeyword } from "../apis";

/**
 * 검색어를 기록하는 뮤테이션 훅
 * 인기 검색어 집계에 사용됩니다. (fire-and-forget 방식)
 */
export const useRecordSearchKeywordMutation = () => {
  return useMutation({
    mutationFn: (keyword: string) => recordSearchKeyword(publicAxios, keyword),
    // 에러가 발생해도 사용자에게 알리지 않음 (UX 방해 금지)
    onError: (error) => {
      console.error("Failed to record search keyword:", error);
    },
  });
};
