"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("book.search");
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
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4 transition-all duration-500 ease-[0.16,1,0.3,1] transform",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none",
      )}
    >
      {/* Frosted Glass Background */}
      <div className="absolute inset-x-0 top-0 h-full bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm" />

      <div className="relative w-full max-w-xl z-10">
        <div className="relative group">
          <button
            onClick={executeSearch}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label={t("button_label")}
          >
            <Search className="w-4 h-4" />
          </button>

          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t("sticky_placeholder")}
            className="w-full pl-11 pr-10 h-11 text-base bg-white/60 border-zinc-200/50 hover:bg-white/90 focus:bg-white focus:border-zinc-300 rounded-full shadow-sm focus:shadow-md focus:ring-2 focus:ring-zinc-100 transition-all duration-300 font-light tracking-wide"
          />

          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
