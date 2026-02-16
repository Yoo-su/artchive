"use client";

import { Suspense } from "react";

import { BookMarket } from "@/features/book-sale/components/sale-market/book-market";
import { PopularBookSaleList } from "@/features/book-sale/components/sale-market/book-market/popular-book-sale-list";
import { BookMarketSkeleton } from "@/features/book-sale/components/sale-market/book-market/skeleton";
import { MarketHero } from "@/features/book-sale/components/sale-market/market-hero";

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
      <Suspense fallback={<BookMarketSkeleton />}>
        <BookMarket />
      </Suspense>
    </div>
  );
};
