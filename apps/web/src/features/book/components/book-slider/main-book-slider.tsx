"use client";

import { HOME_PUBLISHERS } from "@bookjeok/core";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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

  return (
    <div className="w-full bg-stone-50/30 py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto w-full px-4 md:px-0 mb-12 flex flex-col items-center text-center">
        <TextAnimate
          as="h2"
          animation="blurInUp"
          by="character"
          className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-stone-900 pb-2"
        >
          {t("title")}
        </TextAnimate>
        <p className="mt-4 text-base md:text-lg text-stone-500 font-light max-w-xl tracking-wide">
          {t("subtitle")}
        </p>
      </div>

      {/* 출판사 필터 칩 - 트렌디한 필(Pill) 스타일 */}
      <div className="container mx-auto w-full px-4 md:px-0 mb-12 flex justify-center">
        <div className="inline-flex items-center gap-1 p-1.5 bg-white/60 backdrop-blur-xl rounded-full shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-white/40 overflow-x-auto max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {HOME_PUBLISHERS.map((publisher) => (
            <button
              key={publisher}
              onClick={() => setActivePublisher(publisher)}
              className={`relative px-5 md:px-7 py-2 md:py-2.5 rounded-full text-sm md:text-base transition-all duration-500 whitespace-nowrap ${
                activePublisher === publisher
                  ? "text-stone-900 font-semibold shadow-sm"
                  : "text-stone-400 hover:text-stone-700 font-medium"
              }`}
            >
              {activePublisher === publisher && (
                <span className="absolute inset-0 bg-white rounded-full shadow-[0_4px_10px_-4px_rgba(0,0,0,0.1)] -z-10 animate-in zoom-in-95 duration-300" />
              )}
              {publisher}
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
              key={activePublisher}
              effect={"coverflow"}
              grabCursor={true}
              centeredSlides={true}
              loop={displayBooks.length > 5}
              loopAdditionalSlides={5}
              watchSlidesProgress={true}
              observer={true}
              observeParents={true}
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
                  className="w-[180px]! md:w-[240px]! select-none transition-opacity duration-300"
                >
                  <Link
                    href={PATHS.BOOK_DETAIL(book.isbn)}
                    passHref
                    className="block group"
                  >
                    <div className="relative w-full aspect-2/3 mb-6 bg-stone-100 rounded-xl overflow-hidden shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] group-hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.2)] transition-all duration-700 ease-out transform-gpu group-hover:-translate-y-2 border border-stone-200/50">
                      <Image
                        src={book.image || "/images/placeholder-book.svg"}
                        alt={book.title}
                        fill
                        priority={true} // Swiper Loop 복제 이슈 방지를 위한 즉시 로딩
                        unoptimized={true} // 복제 슬라이드 이미지 깨짐 방지
                        sizes="(max-width: 768px) 180px, 240px"
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      {/* 입체감을 위한 내부 그림자 및 효과 */}
                      <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-xl" />
                      <div className="absolute inset-0 bg-linear-to-tr from-black/10 via-transparent to-white/10 group-hover:opacity-0 transition-opacity duration-500" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    </div>

                    {/* 책 정보 - 활성 슬라이드에만 표시 */}
                    <div className="relative w-[240px] md:w-[320px] left-1/2 -translate-x-1/2 space-y-1.5 pt-2 select-none opacity-0 translate-y-6 transition-all duration-700 ease-in-out delay-100 in-[.swiper-slide-active]:opacity-100 in-[.swiper-slide-active]:translate-y-0 text-center">
                      <h3 className="text-stone-900 font-bold text-lg md:text-2xl leading-tight line-clamp-1 px-4">
                        {book.title}
                      </h3>
                      <p className="text-stone-500 text-sm md:text-base font-medium tracking-wide">
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
