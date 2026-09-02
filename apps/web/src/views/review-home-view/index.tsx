"use client";

import { FormEvent, useEffect, useState } from "react";

import { PopularReviewList } from "@/features/review/components/review-list/popular-review-list";
import { ReviewFeedList } from "@/features/review/components/review-list/review-feed-list";
import { ReviewGridList } from "@/features/review/components/review-list/review-grid-list";
import { ReviewHomeFilters } from "@/features/review/components/review-list/review-home-filters";
import { AdBanner } from "@/shared/components/ads/ad-banner";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface ReviewHomeViewProps {
  /** URL의 category 파라미터. 필터가 걸리지 않았으면 null */
  category: string | null;
  /** URL의 search 파라미터. 없으면 빈 문자열 */
  searchQuery: string;
  /** URL 쿼리스트링 원본. 필터를 갱신할 때 기존 파라미터를 보존하기 위해 사용 */
  searchParamsString?: string;
  /**
   * 광고 배너 렌더링 여부.
   *
   * 프리렌더 fallback으로 쓰일 때는 false를 넘깁니다. fallback과 실제 트리가
   * 모두 마운트되면서 AdSense가 같은 슬롯에 두 번 push되는 것을 막기 위함입니다.
   */
  showAdBanner?: boolean;
}

/**
 * 리뷰 홈 본문.
 *
 * useSearchParams를 직접 호출하지 않고 파싱된 값을 props로 받습니다.
 * 정적 렌더링 라우트에서 useSearchParams를 호출하면 가장 가까운 Suspense
 * 경계까지 서버 렌더링이 생략되어, 크롤러에게 빈 페이지가 전달됩니다.
 * URL을 읽는 책임은 ReviewHomeViewWithParams가 맡습니다.
 */
export const ReviewHomeView = ({
  category,
  searchQuery,
  searchParamsString = "",
  showAdBanner = true,
}: ReviewHomeViewProps) => {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const isFiltered = !!(category || searchQuery);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParamsString);
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    router.push(`${PATHS.REVIEWS}?${params.toString()}`);
  };

  const handleCategoryClick = (nextCategory: string) => {
    const params = new URLSearchParams(searchParamsString);

    if (category === nextCategory) {
      params.delete("category");
    } else {
      params.set("category", nextCategory);
    }

    router.push(`${PATHS.REVIEWS}?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchInput("");
    router.push(PATHS.REVIEWS);
  };

  return (
    <>
      <ReviewHomeFilters
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        isFiltered={isFiltered}
        clearFilters={clearFilters}
        selectedCategory={category}
        handleCategoryClick={handleCategoryClick}
      />

      <section className="mb-20 container mx-auto">
        {/* 광고 배너 */}
        {showAdBanner && (
          <AdBanner
            dataAdSlot="6903058843"
            dataAdFormat="horizontal"
            className="w-full mb-8"
          />
        )}

        {!isFiltered ? (
          <>
            <PopularReviewList />
            <ReviewFeedList />
          </>
        ) : (
          <ReviewGridList
            searchQuery={searchQuery}
            category={category}
            clearFilters={clearFilters}
          />
        )}
      </section>
    </>
  );
};
