"use client";

import { MAIN_ARTS } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import { MainArtSlider } from "@/features/art/components/widgets/art-slider/main-art-slider";
import { MainBookSlider } from "@/features/book/components/book-slider/main-book-slider";
import { PopularBookSlider } from "@/features/book/components/book-slider/popular-book-slider";
import { RecentSalesSlider } from "@/features/book-sale/components/sale-market/recent-sale-slider";
import { LoungeHomeWidget } from "@/features/reading-log/components/lounge-feed/lounge-home-widget";
import { RecentReviewList } from "@/features/review/components/recent-review-list";
import { AdBanner } from "@/shared/components/ads/ad-banner";

export const HomeView = () => {
  const tArt = useTranslations("home.sections.art");

  const translatedChips = MAIN_ARTS.map((chip) => ({
    ...chip,
    title: tArt(`genres.${chip.genreCode}`),
  }));

  return (
    <div className="flex flex-col gap-8">
      {/* <HomeHero /> */}
      <MainBookSlider />

      <PopularBookSlider />

      <LoungeHomeWidget />

      <RecentSalesSlider />

      {/* 광고 배너 */}
      <AdBanner
        dataAdSlot="9804554356"
        dataAdFormat="horizontal"
        className="w-full my-4"
      />

      <RecentReviewList />

      {/* 공연/전시 슬라이더 영역 (KOPIS 키 재발급 전까지 임시 비활성화)
      <div>
        <MainArtSlider
          titlePrefix={tArt("spotlight.title_prefix")}
          titleSuffix={tArt("spotlight.title_suffix")}
          desc={tArt("spotlight.desc")}
          chips={translatedChips}
          queryOptions={{ prfstate: "02" }} // "공연중"
          align="right"
        />

        <MainArtSlider
          titlePrefix={tArt("coming_soon.title_prefix")}
          titleSuffix={tArt("coming_soon.title_suffix")}
          desc={tArt("coming_soon.desc")}
          chips={translatedChips}
          queryOptions={{ prfstate: "01" }} // "공연예정"
          align="left"
        />
      </div>
      */}
    </div>
  );
};

export default HomeView;
