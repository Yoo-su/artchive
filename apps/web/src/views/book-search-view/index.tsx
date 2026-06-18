"use client";

import { useInView } from "react-intersection-observer";

import { BookSearchInput } from "@/features/book/components/book-search/book-search-input";
import { BookSearchResultList } from "@/features/book/components/book-search/book-search-result-list";
import { PopularKeywords } from "@/features/book/components/book-search/popular-keywords";
import { SearchHero } from "@/features/book/components/book-search/search-hero";
import { StickyBookSearchBar } from "@/features/book/components/book-search/sticky-book-search-bar";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";

export default function BookSearchView() {
  const { ref, inView, entry } = useInView({
    initialInView: true,
    threshold: 0,
    rootMargin: "-80px 0px 0px 0px", // 헤더 높이만큼 보정
  });

  // 오리지널 검색창이 헤더(80px) 위로 완전히 사라졌을 때만 sticky 검색바를 노출
  const isStickyVisible = !inView && !!entry && entry.boundingClientRect.top < 80;

  return (
    <div className="w-full min-h-screen py-4">
      {/* 스크롤 시 나타나는 Sticky 검색바 */}
      <StickyBookSearchBar isVisible={isStickyVisible} />

      {/* Hero */}
      <SearchHero />

      {/* 검색 input */}
      <div ref={ref}>
        <BookSearchInput />
      </div>

      {/* 인기 검색어 */}
      <div className="flex justify-center mb-8">
        <PopularKeywords />
      </div>

      <BookSearchResultList />

      {/* 맨 위로 이동 플로팅 버튼 */}
      <ScrollTopButton />
    </div>
  );
}
