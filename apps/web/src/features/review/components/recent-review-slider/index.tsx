"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useReviewsQuery } from "@/features/review/queries";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { RecentReviewSliderSkeleton } from "./skeleton";
import { SliderReviewCard } from "./slider-review-card";

export const RecentReviewSlider = () => {
  const t = useTranslations("home.sections.recent_reviews");
  const { data: reviewsData, isLoading } = useReviewsQuery({
    page: 1,
    limit: 10,
  });

  const reviews = reviewsData?.reviews || [];

  const SliderHeader = () => (
    <div className="mb-14 flex flex-col items-center text-center relative z-10 px-4">
      <Link href={PATHS.REVIEWS} className="group flex flex-col items-center">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
          <span className="block text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-2">{t("title_prefix")}</span>
          {t("title_suffix")}
        </h2>
        <div className="w-12 h-[1px] bg-stone-300 my-5 group-hover:w-24 group-hover:bg-stone-900 transition-all duration-500" />
        <p className="text-sm sm:text-base text-stone-500 font-light break-keep max-w-lg">
          {t("desc")}
        </p>
        <ArrowRight className="w-5 h-5 text-stone-300 mt-4 group-hover:text-stone-900 group-hover:translate-y-1 transition-all duration-500 rotate-90" strokeWidth={1.5} />
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <section className="w-full py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <SliderHeader />
        </div>
        <RecentReviewSliderSkeleton />
      </section>
    );
  }

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <SliderHeader />
      </div>
      <Swiper
        modules={[Autoplay]}
        slidesPerView={"auto"}
        spaceBetween={20}
        loop={reviews.length > 3}
        centeredSlides={true}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        observer={true}
        observeParents={true}
        className="px-4! overflow-visible! [clip-path:inset(-100px_-10px)]"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id} className="w-[260px]! py-4 select-none">
            <SliderReviewCard review={review} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
