"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils/cn";

import { useRecordSearchKeywordMutation } from "../../hooks/use-record-search-keyword";

interface StickyBookSearchBarProps {
  isVisible: boolean;
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
}

/**
 * 스크롤 시 나타나는 Sticky 검색바
 * - URL search params 기반으로 검색어 관리
 * - 엔터키로 검색 실행
 */
export const StickyBookSearchBar = ({
  isVisible,
  paramName = "q",
}: StickyBookSearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 검색어 기록 뮤테이션 (fire-and-forget)
  const { mutate: recordKeyword } = useRecordSearchKeywordMutation();

  // URL에서 현재 검색어 가져오기
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
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [inputValue, router, pathname, searchParams, paramName, recordKeyword]);

  // 엔터키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch();
    }
  };

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // 검색어 초기화
  const handleClear = () => {
    setInputValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(paramName);
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
    inputRef.current?.focus();
  };

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 px-4 transition-all duration-500 ease-in-out transform",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-full bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50" />

      <div className="relative w-full max-w-2xl z-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="relative group">
          {/* 왼쪽 아이콘을 클릭 가능한 검색 버튼으로 변경 */}
          <button
            onClick={executeSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-500 transition-colors"
            aria-label="검색"
          >
            <Search className="w-5 h-5" />
          </button>
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="검색어 입력 후 엔터..."
            className="w-full pl-12 pr-10 py-6 text-lg bg-white/50 border-gray-200 focus:bg-white focus:border-blue-500/50 hover:bg-white/80 rounded-full shadow-sm focus:shadow-lg focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
