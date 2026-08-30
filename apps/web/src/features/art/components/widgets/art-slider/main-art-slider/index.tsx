"use client";

import { ArtDomain, Genre, GetArtListParams } from "@bookjeok/core";
import { useArtListQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

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
  badge?: string; // backward compat safely
  titlePrefix: string;
  titleSuffix: string;
  desc: string;
  chips: ArtDomain[];
  queryOptions?: Omit<GetArtListParams, "genreCode">;
  align?: "left" | "right";
}

export const MainArtSlider = ({
  titlePrefix,
  titleSuffix,
  desc,
  chips,
  queryOptions,
  align = "left",
}: MainArtSliderProps) => {
  const [activeGenre, setActiveGenre] = useState<Genre>(chips[0].genreCode);

  const { data: items = [], isLoading } = useArtListQuery({
    ...queryOptions,
    genreCode: activeGenre,
  });

  return (
    <section className="w-full py-16 overflow-hidden">
      {/* 헤더 섹션 - 갤러리/카탈로그 스타일의 가로 균형 에디토리얼 레이아웃 */}
      <div className="w-full mx-auto px-4 mb-14 relative z-10">
        <div
          className={cn(
            "flex flex-col border-t border-stone-200 pt-8 gap-8 relative z-10",
            align === "right"
              ? "items-end text-right"
              : "items-start text-left",
          )}
        >
          <div className={cn(align === "right" ? "text-right" : "text-left")}>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
              <span className="block sm:inline sm:mr-3 text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-0">
                {titlePrefix}
              </span>
              {titleSuffix}
            </h2>
            <p
              className={cn(
                "mt-3 text-sm sm:text-base text-stone-500 font-light break-keep max-w-lg",
                align === "right" ? "ml-auto" : "",
              )}
            >
              {desc}
            </p>
          </div>

          {/* 장르 필터 - 가로 스크롤을 통한 기품있는 모바일 탭 (스크롤바 제거) */}
          <div
            className={cn(
              "flex items-center gap-6 sm:gap-8 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
              align === "right"
                ? "justify-end pr-1 pl-4"
                : "justify-start pl-1 pr-4",
            )}
          >
            {chips.map((chip) => (
              <button
                key={chip.genreCode}
                onClick={() => setActiveGenre(chip.genreCode)}
                className={cn(
                  "text-sm sm:text-base cursor-pointer transition-all duration-300 relative pb-1 whitespace-nowrap",
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
