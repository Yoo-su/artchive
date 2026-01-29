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
    <div className="text-right mb-12">
      <div className="mb-4 flex justify-end">
        <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-sky-600 uppercase bg-sky-50 rounded-full">
          {t("badge")}
        </span>
      </div>
      <Link href={PATHS.REVIEWS} className="group inline-block">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl group-hover:text-sky-700 transition-colors">
          <ArrowRight className="inline-block w-6 h-6 mr-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 rotate-180" />
          <span className="text-sky-600">{t("title_prefix")}</span>{" "}
          {t("title_suffix")}
        </h2>
      </Link>
      <p className="mt-4 text-lg text-gray-500 max-w-2xl ml-auto">
        {t("desc")}
      </p>
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
