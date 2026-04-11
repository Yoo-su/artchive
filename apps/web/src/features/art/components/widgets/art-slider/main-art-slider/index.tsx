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
      {/* 헤더 섹션 - 갤러리/카탈로그 스타일의 가로 균형 에디토리얼 레이아웃 */}
      <div className="max-w-7xl mx-auto px-4 mb-14 relative z-10">
        <div className="flex flex-col border-t border-stone-200 pt-8 gap-8">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
              <span className="block sm:inline sm:mr-3 text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-0">
                {titlePrefix}
              </span>
              {titleSuffix}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-stone-500 font-light break-keep max-w-lg">
              {desc}
            </p>
          </div>

          {/* 장르 필터 - 가로 스크롤을 통한 기품있는 모바일 탭 (스크롤바 제거) */}
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {chips.map((chip) => (
              <button
                key={chip.genreCode}
                onClick={() => setActiveGenre(chip.genreCode)}
                className={cn(
                  "text-sm sm:text-base cursor-pointer transition-all duration-300 relative pb-1 whitespace-nowrap",
                  activeGenre === chip.genreCode
                    ? "text-stone-900 font-medium"
                    : "text-stone-400 hover:text-stone-600 font-light"
                )}
              >
                {chip.title}
                {activeGenre === chip.genreCode && (
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-stone-900 animate-in fade-in zoom-in duration-300" />
                )}
              </button>
            ))}
          </div>
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
