"use client";

import { ArrowLeft } from "lucide-react";
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
    <div className="mb-14 flex flex-col border-b border-stone-200 pb-5 sm:pb-6 relative z-10 text-right px-4 sm:px-0">
      <Link href={PATHS.REVIEWS} className="group flex justify-between items-end w-full relative z-10">
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-stone-300 group-hover:bg-stone-900 group-hover:border-stone-900 transition-all duration-500 shrink-0">
          <ArrowLeft className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors duration-500 rotate-45 group-hover:rotate-0" strokeWidth={1.5} />
        </div>
        <div className="pl-4">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
            <span className="block sm:inline sm:mr-3 text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-0">{t("title_prefix")}</span>
            {t("title_suffix")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-500 font-light break-keep ml-auto">
            {t("desc")}
          </p>
        </div>
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
