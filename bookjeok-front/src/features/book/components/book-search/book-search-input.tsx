"use client";

import debounce from "lodash/debounce";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/shared/components/shadcn/input";

interface BookSearchInputProps {
  /** 쿼리 파라미터 이름 (기본값: "q") */
  paramName?: string;
}

/**
 * 도서 검색 인풋 컴포넌트
 * - URL search params 기반으로 검색어 관리
 * - debounce 적용으로 타이핑 중 불필요한 URL 업데이트 방지
 */
export const BookSearchInput = ({ paramName = "q" }: BookSearchInputProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL에서 현재 검색어 가져오기
  const queryFromUrl = searchParams.get(paramName) || "";
  const [inputValue, setInputValue] = useState(queryFromUrl);

  // URL 변경 시 인풋 값 동기화 (뒤로가기/앞으로가기 지원)
  useEffect(() => {
    setInputValue(queryFromUrl);
  }, [queryFromUrl]);

  // debounce된 URL 업데이트
  const debouncedUpdateUrl = useMemo(
    () =>
      debounce((value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set(paramName, value);
        } else {
          params.delete(paramName);
        }
        const queryString = params.toString();
        router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
          scroll: false,
        });
      }, 500),
    [router, pathname, searchParams, paramName],
  );

  useEffect(() => {
    return () => {
      debouncedUpdateUrl.cancel();
    };
  }, [debouncedUpdateUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedUpdateUrl(value);
  };

  return (
    <div className="relative mb-8">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="어떤 책을 찾고 계신가요?"
        className="w-full pl-10 pr-4 py-3 text-lg border-2 rounded-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      />
    </div>
  );
};
