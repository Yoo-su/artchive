"use client";

import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Autoplay, EffectCoverflow, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { TextAnimate } from "@/shared/components/magicui/text-animate";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { HOME_PUBLISHERS } from "../../constants";
import { useBookListQuery } from "../../queries";
import { BookSliderSkeleton } from "./skeleton";

export const MainBookSlider = () => {
  const t = useTranslations("home.sections.main_books");
  const tError = useTranslations("home.errors");
  const [activePublisher, setActivePublisher] = useState(HOME_PUBLISHERS[0]);
  const swiperRef = useRef<any>(null);

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
          swiperRef.current.slideTo(
            Math.floor((books?.length || 0) / 2),
            0,
            false,
          );
        }
      });
    }
  };

  // 출판사(데이터) 변경 시 Swiper 업데이트
  useEffect(() => {
    updateSwiper();
  }, [books]);

  return (
    <div className="w-full bg-linear-to-b from-white via-gray-50 to-white py-8">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <TextAnimate
          as="h2"
          animation="scaleUp"
          by="line"
          className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
        >
          {t("title")}
        </TextAnimate>
        <TextAnimate
          animation="slideUp"
          by="word"
          as="p"
          className="mt-4 text-lg leading-8 text-gray-600"
        >
          {t("subtitle")}
        </TextAnimate>
      </div>

      {/* 출판사 필터 칩 */}
      <div className="flex justify-center items-center gap-2 mt-8 flex-wrap px-4">
        {HOME_PUBLISHERS.map((publisher) => (
          <Button
            key={publisher}
            variant={activePublisher === publisher ? "default" : "outline"}
            className={`rounded-full cursor-pointer transition-all duration-300 ${
              activePublisher === publisher
                ? "bg-emerald-700 text-white shadow-lg scale-105"
                : "text-gray-600 bg-white"
            }`}
            onClick={() => setActivePublisher(publisher)}
          >
            {publisher}
          </Button>
        ))}
      </div>

      {isLoading && <BookSliderSkeleton />}

      {!isLoading && (isError || !books || books.length === 0) && (
        <div className="text-center py-20 text-gray-500">
          <BookOpen className="mx-auto h-12 w-12" />
          <p className="mt-4">{tError("load_books")}</p>
        </div>
      )}

      {!isLoading && books && books.length > 0 && (
        <div className="relative w-full book-swiper-container overflow-hidden">
          <Swiper
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            effect={"coverflow"}
            grabCursor={true}
            centeredSlides={true}
            loop={displayBooks.length > 5}
            loopAdditionalSlides={5} // 데이터 복제 + 적절한 버퍼로 완벽한 Loop 구현
            slidesPerView={"auto"}
            spaceBetween={-50}
            initialSlide={Math.floor(displayBooks.length / 2)}
            watchSlidesProgress={true}
            observer={true}
            observeParents={true}
            coverflowEffect={{
              rotate: 0,
              stretch: 80,
              depth: 200,
              modifier: 1,
              slideShadows: false,
            }}
            navigation={{
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            modules={[EffectCoverflow, Navigation, Autoplay]}
            className="book-swiper"
          >
            {displayBooks.map((book, index) => (
              <SwiperSlide
                key={`${book.isbn}-${index}`} // 고유한 키 보장
                className="w-[240px]! md:w-[300px]! select-none"
              >
                <Link href={PATHS.BOOK_DETAIL(book.isbn)} passHref>
                  <div className="group relative w-full h-[360px] md:h-[450px] rounded-lg overflow-hidden shadow-2xl transform transition-transform duration-500 bg-gray-200">
                    <Image
                      src={book.image || "/images/placeholder-book.svg"}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 240px, 300px"
                      priority={true}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="book-info-overlay absolute inset-0 bg-black/0 flex flex-col justify-end items-center p-6 text-center opacity-0">
                      <h3 className="text-white font-bold text-xl md:text-2xl mb-2 drop-shadow-lg">
                        {book.title}
                      </h3>
                      <p className="text-gray-200 text-sm md:text-base drop-shadow-md">
                        {book.author}
                      </p>
                    </div>
                  </div>
                </Link>
              </SwiperSlide>
            ))}

            <div className="swiper-button-prev">
              <ChevronLeft size={24} />
            </div>
            <div className="swiper-button-next">
              <ChevronRight size={24} />
            </div>
          </Swiper>
        </div>
      )}
    </div>
  );
};
