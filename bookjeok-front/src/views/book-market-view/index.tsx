"use client";

import { Suspense } from "react";

import { BookMarket } from "@/features/book-sale/components/sale-market/book-market";
import { PopularBookSaleList } from "@/features/book-sale/components/sale-market/book-market/popular-book-sale-list";
import { MarketHero } from "@/features/book-sale/components/sale-market/market-hero";
import { AdBanner } from "@/shared/components/ads/ad-banner";

export const BookMarketView = () => {
  return (
    <div className="w-full py-8">
      <MarketHero />

      {/* 광고 배너 */}
      {/* <AdBanner
        dataAdSlot="4727503402"
        dataAdFormat="horizontal"
        className="w-full mb-8"
      /> */}

      <div className="mb-8">
        <PopularBookSaleList />
      </div>

      {/* Suspense로 감싸서 useSearchParams hydration 이슈 해결 */}
      <Suspense fallback={<BookMarketFilterSkeleton />}>
        <BookMarket />
      </Suspense>
    </div>
  );
};

/**
 * BookMarket 로딩 중 표시할 스켈레톤 UI
 */
const BookMarketFilterSkeleton = () => (
  <div className="mb-8 space-y-4 rounded-lg border bg-card p-4 animate-pulse">
    <div className="h-10 bg-gray-200 rounded w-full" />
    <div className="flex gap-4">
      <div className="h-10 bg-gray-200 rounded w-32" />
      <div className="h-10 bg-gray-200 rounded w-32" />
    </div>
    <div className="grid grid-cols-3 gap-6 mt-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 bg-gray-200 rounded" />
      ))}
    </div>
  </div>
);
