"use client";

import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { AiChatWindow } from "@/features/book/components/book-search/ai-chat-window";
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
      {/* 스크롤 시 나타나는 Sticky 검색바 (키워드 검색 모드 전용) */}
      {searchMode === "KEYWORD" && (
        <StickyBookSearchBar isVisible={isStickyVisible} />
      )}

      {/* Hero 영역 (기존 UI 유지) */}
      <SearchHero />

      {/* 탭 메뉴: [ 키워드 검색 | AI 추천 검색 ] */}
      <SearchModeTabs activeMode={searchMode} onModeChange={setSearchMode} />

      {/* 모드별 뷰 스위칭 */}
      {searchMode === "KEYWORD" ? (
        <>
          <div ref={ref}>
            <BookSearchInput />
          </div>

          <div className="flex justify-center mb-8">
            <PopularKeywords />
          </div>

          <BookSearchResultList />
        </>
      ) : (
        <AiChatWindow />
      )}

      {/* 맨 위로 이동 플로팅 버튼 */}
      <ScrollTopButton />
    </div>
  );
}
