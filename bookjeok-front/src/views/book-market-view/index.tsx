"use client";

import { Suspense } from "react";

import { BookMarket } from "@/features/book/components/book-market";
import { PopularBookSaleList } from "@/features/book/components/book-market/popular-book-sale-list";
import { AdBanner } from "@/shared/components/ads/ad-banner";

export const BookMarketView = () => {
  return (
    <div className="w-full py-8">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          중고 서적 마켓
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          원하는 책을 찾아보세요! 다양한 중고 서적들이 있습니다.
        </p>
      </section>

      {/* 광고 배너 */}
      <AdBanner
        dataAdSlot="4727503402"
        dataAdFormat="horizontal"
        className="w-full mb-8"
      />

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
