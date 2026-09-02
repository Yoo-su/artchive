"use client";

import { Suspense } from "react";

import { BookMarket } from "@/features/book-sale/components/sale-market/book-market";
import { PopularBookSaleList } from "@/features/book-sale/components/sale-market/book-market/popular-book-sale-list";
import { BookMarketWithParams } from "@/features/book-sale/components/sale-market/book-market/with-params";
import { MarketHero } from "@/features/book-sale/components/sale-market/market-hero";
import { AdBanner } from "@/shared/components/ads/ad-banner";

export const BookMarketView = () => {
  return (
    <div className="w-full py-8">
      <MarketHero />

      {/* 광고 배너 */}
      <AdBanner
        dataAdSlot="4727503402"
        dataAdFormat="horizontal"
        className="w-full mb-8"
      />

      <div className="mb-8">
        <PopularBookSaleList />
      </div>

      {/*
        useSearchParams는 정적 렌더링 라우트에서 가장 가까운 Suspense 경계까지
        서버 렌더링을 건너뛰게 만듭니다. 그래서 URL을 읽는 래퍼만 경계 안에 두고,
        fallback으로는 스켈레톤 대신 "필터가 걸리지 않은 기본 목록"을 넘깁니다.
        fallback은 서버에서 렌더링되므로, 크롤러와 JS를 실행하지 않는 클라이언트가
        실제 판매글 목록이 담긴 HTML을 받게 됩니다.
      */}
      <Suspense fallback={<BookMarket params={{}} />}>
        <BookMarketWithParams />
      </Suspense>
    </div>
  );
};
