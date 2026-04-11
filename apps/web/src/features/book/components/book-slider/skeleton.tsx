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
            className="w-[180px]! md:w-[240px]! select-none"
          >
            <div className="block">
              <div className="relative w-full aspect-2/3 mb-6 bg-stone-100 rounded-xl overflow-hidden border border-stone-200/50 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)]">
                <Skeleton className="w-full h-full bg-stone-200/60" />
              </div>

              {/* 책 정보 영역 스켈레톤 (오퍼시티 없이 항상 노출, 위치 조정) */}
              <div className="relative w-[240px] md:w-[320px] left-1/2 -translate-x-1/2 space-y-2 text-center pt-2">
                <Skeleton className="h-6 md:h-8 w-32 md:w-48 mx-auto bg-stone-200/60" />
                <Skeleton className="h-4 md:h-5 w-24 md:w-32 mx-auto bg-stone-200/80" />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  </div>
);
