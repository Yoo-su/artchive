"use client";

import { Swiper, SwiperSlide } from "swiper/react";

import { usePopularReviewsQuery } from "@/features/review/queries";
import { Badge } from "@/shared/components/shadcn/badge";

import { PopularReviewItem } from "./popular-review-item";
import { PopularReviewListSkeleton } from "./skeleton";

export function PopularReviewList() {
  // 1. 데이터 조회
  const { data: reviews, isLoading, isError } = usePopularReviewsQuery();

  // 2. 로딩 가드
  if (isLoading) {
    return <PopularReviewListSkeleton />;
  }

  // 3. 에러 가드
  if (isError) {
    return (
      <section className="mb-12">
        <div className="h-[200px] w-full rounded-xl border border-dashed border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-500 gap-2">
          <span>인기 리뷰를 불러오는데 실패했습니다.</span>
        </div>
      </section>
    );
  }

  // 4. 빈 상태 가드
  if (!reviews || reviews.length === 0) {
    return null; // 인기 리뷰가 없으면 섹션 자체를 숨김
  }

  // 5. 성공 렌더링

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-stone-900">🔥 지금 뜨는 리뷰</h2>
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-600 hover:bg-orange-200"
        >
          HOT
        </Badge>
      </div>

      {/* Mobile: Swiper */}
      <div className="block md:hidden">
        <Swiper
          spaceBetween={20}
          slidesPerView={1.1}
          breakpoints={{
            450: { slidesPerView: 1.2 },
          }}
          className="w-full px-1! pt-2! pb-4!"
        >
          {reviews.map((review) => (
            <SwiperSlide key={review.id} className="h-auto! select-none">
              <PopularReviewItem review={review} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map((review) => (
          <PopularReviewItem key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
