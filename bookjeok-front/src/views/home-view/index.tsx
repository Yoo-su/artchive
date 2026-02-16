"use client";

import { useTranslations } from "next-intl";

import { MainArtSlider } from "@/features/art/components/widgets/art-slider/main-art-slider";
import { MAIN_ARTS } from "@/features/art/constants";
import { MainBookSlider } from "@/features/book/components/book-slider/main-book-slider";
import { PopularBookSlider } from "@/features/book/components/book-slider/popular-book-slider";
import { RecentSalesSlider } from "@/features/book-sale/components/sale-market/recent-sale-slider";
import { HomeHero } from "@/features/intro/components/hero/home-hero";
import { TasteFinderWidget } from "@/features/recommend/components/widgets/taste-finder-widget";
import { RecentReviewSlider } from "@/features/review/components/recent-review-slider";
import { AdBanner } from "@/shared/components/ads/ad-banner";

export const HomeView = () => {
  const tArt = useTranslations("home.sections.art");

  const translatedChips = MAIN_ARTS.map((chip) => ({
    ...chip,
    title: tArt(`genres.${chip.genreCode}`),
  }));

  return (
    <div className="flex flex-col gap-8">
      <HomeHero />
      <MainBookSlider />

      {/* <TasteFinderWidget /> */}

      <PopularBookSlider />

      <RecentSalesSlider />

      {/* 광고 배너 */}
      {/* <AdBanner
        dataAdSlot="9804554356"
        dataAdFormat="horizontal"
        className="w-full my-4"
      /> */}

      <RecentReviewSlider />

      <div>
        <MainArtSlider
          badge={tArt("spotlight.badge")}
          titlePrefix={tArt("spotlight.title_prefix")}
          titleSuffix={tArt("spotlight.title_suffix")}
          desc={tArt("spotlight.desc")}
          chips={translatedChips}
          queryOptions={{ prfstate: "02" }} // "공연중"
        />

        <MainArtSlider
          badge={tArt("coming_soon.badge")}
          titlePrefix={tArt("coming_soon.title_prefix")}
          titleSuffix={tArt("coming_soon.title_suffix")}
          desc={tArt("coming_soon.desc")}
          chips={translatedChips}
          queryOptions={{ prfstate: "01" }} // "공연예정"
        />
      </div>
    </div>
  );
};

export default HomeView;
