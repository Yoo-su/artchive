"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { usePathname, useRouter } from "@/shared/config/i18n/routing";

import { useRecordSearchKeywordMutation } from "../queries";

interface UseBookSearchParamsProps {
  paramName?: string;
}

/**
 * 도서 검색 파라미터 및 인풋 제어를 위한 통합 훅
 * - URL 검색 파라미터 동기화
 * - 검색 실행 및 검색어 로그 전송(Mutation) 관리
 * - 클라이언트 컴포넌트 간 일관성 유지
 */
export const useBookSearchParams = ({ paramName = "q" }: UseBookSearchParamsProps = {}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mutate: recordKeyword } = useRecordSearchKeywordMutation();

  const queryFromUrl = searchParams.get(paramName) || "";
  const [inputValue, setInputValue] = useState(queryFromUrl);

  // URL 변경 시 인풋 값 동기화 (뒤로가기/앞으로가기 지원)
  useEffect(() => {
    setInputValue(queryFromUrl);
  }, [queryFromUrl]);

  // 검색 실행 함수
  const executeSearch = useCallback(() => {
    const trimmedValue = inputValue.trim();
    const params = new URLSearchParams(searchParams.toString());

    if (trimmedValue) {
      params.set(paramName, trimmedValue);
      // 검색어 기록 (fire-and-forget)
      recordKeyword(trimmedValue);
    } else {
      params.delete(paramName);
    }

    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.pushState(null, "", newUrl);
  }, [inputValue, pathname, searchParams, paramName, recordKeyword]);

  // 엔터키 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        executeSearch();
      }
    },
    [executeSearch],
  );

  // 검색어 초기화 핸들러
  const handleClear = useCallback(() => {
    setInputValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    const queryString = params.toString();
    const newUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
    window.history.pushState(null, "", newUrl);
  }, [pathname, searchParams, paramName]);

  return {
    inputValue,
    setInputValue,
    executeSearch,
    handleKeyDown,
    handleClear,
  };
};
