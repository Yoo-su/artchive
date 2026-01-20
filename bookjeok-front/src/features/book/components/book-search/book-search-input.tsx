"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Input } from "@/shared/components/shadcn/input";

import { useRecordSearchKeywordMutation } from "../../hooks/use-record-search-keyword";

interface BookSearchInputProps {
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
}

/**
 * 도서 검색 인풋 컴포넌트
 * - URL search params 기반으로 검색어 관리
 * - 엔터키 또는 검색 버튼 클릭 시 검색 실행
 */
export const BookSearchInput = ({ paramName = "q" }: BookSearchInputProps) => {
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

  return (
    <div className="relative mb-8">
      <div className="relative group">
        {/* 왼쪽 돋보기 아이콘 (장식용) */}
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />

        <Input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="어떤 책을 찾고 계신가요?"
          className="w-full pl-12 pr-16 py-6 text-lg border-2 rounded-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        />

        {/* 오른쪽 검색 버튼 (동그란 원형) */}
        <button
          onClick={executeSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-400 hover:bg-blue-500 text-white rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center"
          aria-label="검색"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
