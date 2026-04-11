"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { usePopularBooksQuery } from "../../queries";

/**
 * 인기책 슬라이더 컴포넌트
 * - 조회수, 판매글, 리뷰 데이터 기반 인기책 표시
 * - 숫자 순위 + 미니멀 텍스트 정보
 */
export const PopularBookSlider = () => {
  const t = useTranslations("home.sections.popular_books");
  const { data: books, isLoading, isError } = usePopularBooksQuery();

  if (isLoading) {
    return <PopularBookSliderSkeleton />;
  }

  if (isError || !books || books.length === 0) {
    return null; // 데이터가 없으면 섹션 자체를 숨김
  }

  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 - 기품있는 버티컬 라인 에디토리얼 스타일 */}
        <div className="mb-14 relative flex items-end">
          <div className="absolute -top-8 sm:-top-16 -left-2 sm:-left-4 text-[100px] sm:text-[140px] font-serif italic text-stone-100/50 leading-none tracking-tighter select-none pointer-events-none z-0">
            TOP
          </div>
          <div className="relative z-10 flex justify-between items-end w-full">
            <div className="border-l-[3px] border-stone-900 pl-5 sm:pl-6">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-medium text-stone-900 tracking-tight break-keep">
                {t("title")}
              </h2>
              <p className="text-sm sm:text-base text-stone-500 font-light mt-3 max-w-md break-keep">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* 슬라이더 */}
        <Swiper
          modules={[Autoplay]}
          slidesPerView="auto"
          spaceBetween={16}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          observer={true}
          observeParents={true}
          className="w-full"
        >
          {books.map((book, index) => (
            <SwiperSlide
              key={book.isbn}
              className="w-[140px]! sm:w-[160px]! select-none"
            >
              <Link href={PATHS.BOOK_DETAIL(book.isbn)} passHref>
                <div className="group">
                  {/* 책 표지 */}
                  <div className="relative aspect-2/3 overflow-hidden bg-stone-100 transition-all duration-300 group-hover:shadow-md">
                    <Image
                      src={book.image || "/placeholder.jpg"}
                      alt={book.title}
                      fill
                      sizes="160px"
                      priority={index < 4}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* 순위 - 좌하단 큰 숫자 + 베일 그라디언트 */}
                    <div
                      className={`absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-black/40 to-transparent ${
                        index < 3 ? "opacity-60" : "opacity-30"
                      }`}
                    />
                    <div className="absolute bottom-0 left-0 px-2.5 pb-1">
                      <span
                        className={`font-bold leading-none text-white ${
                          index < 3
                            ? "text-3xl drop-shadow-lg"
                            : "text-2xl opacity-70 drop-shadow-sm"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>

                    {/* 호버 시 미세한 어두움 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>

                  {/* 책 정보 */}
                  <div className="mt-2.5 space-y-0.5">
                    <h3 className="text-sm font-medium text-stone-800 line-clamp-2 leading-snug group-hover:text-stone-500 transition-colors duration-200">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-stone-400 line-clamp-1 font-light">
                      {book.author}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

/**
 * 인기책 슬라이더 스켈레톤
 */
const PopularBookSliderSkeleton = () => {
  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 스켈레톤 */}
        <div className="mb-10 flex items-end gap-4 animate-pulse">
          <Skeleton className="h-16 w-24 bg-stone-100" />
          <div className="pb-1 space-y-1.5">
            <Skeleton className="h-5 w-32 bg-stone-100" />
            <Skeleton className="h-3 w-48 bg-stone-50" />
          </div>
        </div>

        <div className="flex gap-4 overflow-hidden animate-pulse">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-[140px] sm:w-[160px] shrink-0">
              <div className="relative aspect-2/3 bg-stone-100 overflow-hidden">
                {/* 하단 그라디언트 베일 */}
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-stone-200/60 to-transparent" />
                {/* 순위 번호 */}
                <div className="absolute bottom-0 left-0 px-2.5 pb-1">
                  <span className="text-2xl font-bold text-stone-300/60">
                    {i + 1}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 space-y-1">
                <Skeleton className="h-4 w-full bg-stone-100" />
                <Skeleton className="h-3 w-3/4 bg-stone-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
