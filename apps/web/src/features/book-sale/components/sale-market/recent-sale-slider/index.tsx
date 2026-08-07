"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useRecentBookSalesQuery } from "@/features/book-sale/queries";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { RecentSaleCard } from "./recent-sale-card";
import { RecentSalesSliderSkeleton } from "./skeleton";

export const RecentSalesSlider = () => {
  const t = useTranslations("home.sections.recent_sales");
  const { data: sales, isLoading, isError } = useRecentBookSalesQuery();

  // 슬라이드 개수가 5개 이상일 때만 무한 Loop 및 Autoplay 활성화
  const isLoopable = useMemo(() => {
    return Boolean(sales && sales.length >= 5);
  }, [sales]);

  const SliderHeader = () => (
    <div className="mb-14 flex flex-col border-b border-stone-200 pb-5 sm:pb-6 relative z-10 text-right">
      <Link href={PATHS.BOOK_MARKET} className="group flex justify-between items-end w-full relative z-10">
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-stone-300 group-hover:bg-stone-900 group-hover:border-stone-900 transition-all duration-500 shrink-0">
          <ArrowLeft className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors duration-500 rotate-45 group-hover:rotate-0" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
            <span className="block sm:inline sm:mr-3 text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-0">
              {t("title_prefix")}
            </span>
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
      <section className="w-full py-16  overflow-hidden">
        <div className="w-full mx-auto px-4">
          <SliderHeader />
        </div>
        <RecentSalesSliderSkeleton />
      </section>
    );
  }

  if (isError || !sales || sales.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-16 overflow-hidden">
      <div className="w-full mx-auto px-4">
        <SliderHeader />
      </div>
      <Swiper
        modules={[Autoplay]}
        slidesPerView={"auto"}
        spaceBetween={24}
        loop={isLoopable}
        loopAdditionalSlides={isLoopable ? 5 : 0}
        centeredSlides={isLoopable}
        speed={800}
        autoplay={
          isLoopable
            ? {
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }
            : false
        }
        observer={true}
        observeParents={true}
        className="px-4! overflow-visible! [clip-path:inset(-100px_-10px)]"
      >
        {sales.map((sale, index) => (
          <SwiperSlide
            key={sale.id}
            className="w-[200px]! py-4 select-none"
          >
            <RecentSaleCard sale={sale} priority={index < 4} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
