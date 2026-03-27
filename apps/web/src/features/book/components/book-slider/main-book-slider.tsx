"use client";

import "swiper/css";
import "swiper/css/effect-coverflow";

import { HOME_PUBLISHERS } from "@bookjeok/core/book";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { TextAnimate } from "@/shared/components/magicui/text-animate";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useBookListQuery } from "../../queries";
import { BookSliderSkeleton } from "./skeleton";

export const MainBookSlider = () => {
  const t = useTranslations("home.sections.main_books");
  const tError = useTranslations("home.errors");
  const [activePublisher, setActivePublisher] = useState(HOME_PUBLISHERS[0]);
  const swiperRef = useRef<SwiperType | null>(null);

  const {
    data: books,
    isLoading,
    isError,
  } = useBookListQuery({ query: activePublisher, display: 10 });

  // 슬라이드가 충분히 많도록 데이터 복제 (Loop 안정성 및 빈 공간 방지)
  const displayBooks = useMemo(() => {
    if (!books || books.length === 0) return [];

    // 최소 15개 이상 확보
    const minCount = 15;
    if (books.length >= minCount) return books;

    const multiplier = Math.ceil(minCount / books.length);
    return Array(multiplier)
      .fill(books)
      .flat()
      .slice(0, Math.max(minCount, books.length * 3)); // 넉넉하게 복제
  }, [books]);

  // Swiper 업데이트 함수 (출판사 변경 시 슬라이드 위치 조정용)
  const updateSwiper = () => {
    if (swiperRef.current) {
      requestAnimationFrame(() => {
        if (swiperRef.current) {
          swiperRef.current.update();
          swiperRef.current.slideToLoop(0, 0, false); // Loop 모드에서는 slideToLoop 사용
        }
      });
    }
  };

  // 출판사(데이터) 변경 시 Swiper 업데이트
  useEffect(() => {
    updateSwiper();
  }, [books]);

  return (
    <div className="w-full bg-stone-50/30 py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto max-w-4xl px-4 md:px-0 mb-12 flex flex-col items-center text-center">
        <TextAnimate
          as="h2"
          animation="blurInUp"
          by="character"
          className="text-4xl md:text-5xl font-serif font-medium tracking-tight text-stone-900"
        >
          {t("title")}
        </TextAnimate>
        <p className="mt-4 text-base md:text-lg text-stone-500 font-light max-w-xl">
          {t("subtitle")}
        </p>
      </div>

      {/* 출판사 필터 칩 - 미니멀 텍스트 탭 (중앙 정렬) */}
      <div className="container mx-auto max-w-4xl px-4 md:px-0 mb-12">
        <div className="flex items-center justify-center gap-6 md:gap-8 flex-wrap">
          {HOME_PUBLISHERS.map((publisher) => (
            <button
              key={publisher}
              onClick={() => setActivePublisher(publisher)}
              className={`text-sm md:text-base cursor-pointer transition-all duration-300 relative pb-1 ${
                activePublisher === publisher
                  ? "text-stone-900 font-medium"
                  : "text-stone-400 hover:text-stone-600 font-light"
              }`}
            >
              {publisher}
              {activePublisher === publisher && (
                <span className="absolute bottom-0 left-0 w-full h-px bg-stone-900 animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <BookSliderSkeleton />}

      {!isLoading && (isError || !books || books.length === 0) && (
        <div className="text-center py-20 text-stone-400">
          <BookOpen className="mx-auto h-10 w-10 opacity-20" />
          <p className="mt-4 font-light">{tError("load_books")}</p>
        </div>
      )}

      {!isLoading && books && books.length > 0 && (
        <div className="w-full relative">
          <div className="book-swiper-container overflow-visible! px-4 md:px-0">
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              effect={"coverflow"}
              grabCursor={true}
              centeredSlides={true}
              loop={displayBooks.length > 5}
              slidesPerView={"auto"}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 100,
                modifier: 2.5,
                slideShadows: false,
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              modules={[EffectCoverflow, Autoplay]}
              className="book-swiper overflow-visible!"
            >
              {displayBooks.map((book, index) => (
                <SwiperSlide
                  key={`${book.isbn}-${index}`} // 고유 키 보장
                  className="w-[140px]! md:w-[200px]! select-none transition-opacity duration-300"
                >
                  <Link
                    href={PATHS.BOOK_DETAIL(book.isbn)}
                    passHref
                    className="block group"
                  >
                    <div className="relative w-full aspect-2/3 mb-4 bg-stone-200 overflow-hidden shadow-sm group-hover:shadow-lg transition-all duration-500 ease-out border border-stone-100">
                      <Image
                        src={book.image || "/images/placeholder-book.svg"}
                        alt={book.title}
                        fill
                        priority={true} // Swiper Loop 복제 이슈 방지를 위한 즉시 로딩
                        unoptimized={true} // 복제 슬라이드 이미지 깨짐 방지
                        sizes="(max-width: 768px) 160px, 220px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* 미니멀 오버레이 - 호버 시 미세한 어두움 효과 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                    </div>

                    {/* 책 정보 - 활성 슬라이드에만 표시 */}
                    <div className="relative w-[200px] md:w-[280px] left-1/2 -translate-x-1/2 space-y-1 pt-2 select-none opacity-0 translate-y-4 transition-all duration-500 ease-out delay-200 in-[.swiper-slide-active]:opacity-100 in-[.swiper-slide-active]:translate-y-0 text-center">
                      <h3 className="text-stone-900 font-medium text-lg md:text-xl leading-tight">
                        {book.title}
                      </h3>
                      <p className="text-stone-500 text-sm md:text-base font-light">
                        {book.author}
                      </p>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </div>
  );
};
