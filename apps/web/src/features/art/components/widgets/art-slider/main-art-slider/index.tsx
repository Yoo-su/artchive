"use client";

import { ArtDomain, Genre, GetArtListParams } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useArtListQuery } from "@/features/art/queries";
import { cn } from "@/shared/utils";

import { ArtSliderSkeleton } from "../skeleton";
import { MainArtCard } from "./main-art-card";

// 결과 없음 상태 컴포넌트
const NoResults = () => {
  const t = useTranslations("home.sections.art.empty");
  return (
    <div className="h-[380px] flex flex-col items-center justify-center text-center">
      <p className="text-base text-stone-400 font-light">{t("title")}</p>
      <p className="mt-1 text-sm text-stone-300">{t("desc")}</p>
    </div>
  );
};

interface MainArtSliderProps {
  badge: string;
  titlePrefix: string;
  titleSuffix: string;
  desc: string;
  chips: ArtDomain[];
  queryOptions?: Omit<GetArtListParams, "genreCode">;
}

export const MainArtSlider = ({
  badge,
  titlePrefix,
  titleSuffix,
  desc,
  chips,
  queryOptions,
}: MainArtSliderProps) => {
  const [activeGenre, setActiveGenre] = useState<Genre>(chips[0].genreCode);

  const { data: items = [], isLoading } = useArtListQuery({
    ...queryOptions,
    genreCode: activeGenre,
  });

  return (
    <section className="w-full py-16 overflow-hidden">
      {/* 헤더 섹션 - 좌측 정렬, 라인+뱃지 스타일 */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-stone-300" />
            <span className="text-[10px] font-bold text-stone-500 tracking-[0.2em] uppercase">
              {badge}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            <span className="block text-gray-400 font-medium text-2xl mb-1">
              {titlePrefix}
            </span>
            {titleSuffix}
          </h2>
          <p className="mt-4 text-base text-stone-500 font-light max-w-2xl">
            {desc}
          </p>
        </div>

        {/* 장르 필터 - 미니멀 텍스트 탭 */}
        <div className="mt-10 flex items-center gap-6 md:gap-8 flex-wrap">
          {chips.map((chip) => (
            <button
              key={chip.genreCode}
              onClick={() => setActiveGenre(chip.genreCode)}
              className={cn(
                "text-sm md:text-base cursor-pointer transition-all duration-300 relative pb-1",
                activeGenre === chip.genreCode
                  ? "text-stone-900 font-medium"
                  : "text-stone-400 hover:text-stone-600 font-light",
              )}
            >
              {chip.title}
              {activeGenre === chip.genreCode && (
                <span className="absolute bottom-0 left-0 w-full h-px bg-stone-900 animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 슬라이더 */}
      <div>
        {isLoading ? (
          <ArtSliderSkeleton />
        ) : items.length > 0 ? (
          <Swiper
            key={activeGenre}
            className="px-4! sm:px-8! py-4 w-full overflow-visible! [clip-path:inset(-100px_-10px)]"
            modules={[Autoplay]}
            slidesPerView={"auto"}
            spaceBetween={20}
            centeredSlides={true}
            loop={items.length > 3}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
          >
            {items.map((item) => (
              <SwiperSlide
                key={item.mt20id}
                className="w-[220px]! sm:w-[260px]! select-none"
              >
                <MainArtCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <NoResults />
        )}
      </div>
    </section>
  );
};
