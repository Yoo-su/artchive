"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { AiSearchResultList } from "@/features/book/components/book-search/ai-search-result-list";
import { BookSearchInput } from "@/features/book/components/book-search/book-search-input";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { PopularKeywords } from "@/features/book/components/book-search/popular-keywords";
import { SearchHero } from "@/features/book/components/book-search/search-hero";
import {
  SearchMode,
  SearchModeTabs,
} from "@/features/book/components/book-search/search-mode-tabs";
import { StickyBookSearchBar } from "@/features/book/components/book-search/sticky-book-search-bar";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";

export default function BookSearchView() {
  const t = useTranslations("book.search");
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchMode, setSearchMode] = useState<SearchMode>("KEYWORD");

  const { ref, inView, entry } = useInView({
    initialInView: true,
    threshold: 0,
    rootMargin: "-80px 0px 0px 0px", // 헤더 높이만큼 보정
  });

  // 오리지널 검색창이 헤더(80px) 위로 완전히 사라졌을 때만 sticky 검색바를 노출
  const isStickyVisible =
    !inView && !!entry && entry.boundingClientRect.top < 80;

  return (
    <div className="w-full min-h-screen py-4">
      {/* 스크롤 시 나타나는 Sticky 검색바 */}
      <StickyBookSearchBar isVisible={isStickyVisible} />

      {/* Hero 영역 (기존 UI 유지) */}
      <SearchHero />

      {/* 탭 메뉴: [ 키워드 검색 | AI 추천 검색 ] */}
      <SearchModeTabs
        activeMode={searchMode}
        onModeChange={setSearchMode}
      />

      {/* 검색 input */}
      <div ref={ref}>
        <BookSearchInput
          placeholder={
            searchMode === "AI" ? t("ai_placeholder") : t("placeholder")
          }
        />
      </div>

      {/* 인기 검색어 (키워드 검색 모드일 때만 노출) */}
      {searchMode === "KEYWORD" && (
        <div className="flex justify-center mb-8">
          <PopularKeywords />
        </div>
      )}

      {/* 하단 검색 결과 컨텐츠 스위칭 */}
      {searchMode === "KEYWORD" ? (
        <BookSearchResultList />
      ) : (
        <AiSearchResultList query={query} />
      )}

      {/* 맨 위로 이동 플로팅 버튼 */}
      <ScrollTopButton />
    </div>
  );
}
