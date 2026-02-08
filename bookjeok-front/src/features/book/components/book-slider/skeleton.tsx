"use client";

import "swiper/css";
import "swiper/css/effect-coverflow";

import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSliderSkeleton = () => (
  <div className="w-full relative">
    <div className="book-swiper-container overflow-visible! px-4 md:px-0">
      <Swiper
        effect={"coverflow"}
        grabCursor={false}
        centeredSlides={true}
        slidesPerView={"auto"}
        initialSlide={3}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: false,
        }}
        modules={[EffectCoverflow]}
        className="book-swiper overflow-visible!"
      >
        {[...Array(7)].map((_, index) => (
          <SwiperSlide
            key={index}
            className="w-[140px]! md:w-[200px]! select-none"
          >
            <div className="block">
              <div className="relative w-full aspect-2/3 mb-4 bg-stone-200 overflow-hidden shadow-sm border border-stone-100">
                <Skeleton className="w-full h-full bg-stone-200" />
              </div>

              {/* 책 정보 영역 - 활성 슬라이드에만 표시 */}
              <div className="space-y-1 pt-2 select-none opacity-0 translate-y-4 transition-all duration-500 ease-out delay-200 in-[.swiper-slide-active]:opacity-100 in-[.swiper-slide-active]:translate-y-0 text-center">
                <Skeleton className="h-6 w-32 md:w-40 mx-auto bg-stone-200" />
                <Skeleton className="h-4 w-24 md:w-32 mx-auto bg-stone-200" />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  </div>
);
