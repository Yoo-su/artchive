"use client";

import { MainArtSlider } from "@/features/art/components/widgets/art-slider/main-art-slider";
import { MAIN_ARTS } from "@/features/art/constants";
import { MainBookSlider } from "@/features/book/components/book-slider/main-book-slider";
import { PopularBookSlider } from "@/features/book/components/book-slider/popular-book-slider";
import { RecentSalesSlider } from "@/features/book-sale/components/sale-market/recent-sale-slider";
import { TasteFinderWidget } from "@/features/recommend/components/widgets/taste-finder-widget";
import { RecentReviewSlider } from "@/features/review/components/recent-review-slider";
import { AdBanner } from "@/shared/components/ads/ad-banner";

export const HomeView = () => {
  return (
    <div className="flex flex-col gap-8">
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
          title="Spotlight: 오늘의 무대"
          subtitle="도시의 밤을 밝히는 가장 뜨거운 공연들을 만나보세요."
          chips={MAIN_ARTS}
          queryOptions={{ prfstate: "02" }} // "공연중"
        />

        <MainArtSlider
          title="Coming Soon: 설레는 기다림"
          subtitle="곧 막을 올릴 기대작들을 미리 만나보는 시간."
          chips={MAIN_ARTS}
          queryOptions={{ prfstate: "01" }} // "공연예정"
        />
      </div>
    </div>
  );
};

export default HomeView;
