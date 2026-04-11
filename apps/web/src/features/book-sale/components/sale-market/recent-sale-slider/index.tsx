"use client";

import { ArrowRight } from "lucide-react";
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

  // 슬라이드가 화면을 충분히 채울 수 있도록 아이템 복제
  // 최소 8개 이상의 슬라이드가 있어야 loop가 자연스럽게 작동
  const displaySales = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    if (sales.length >= 15) return sales;

    // 아이템이 15개 미만이면 복제해서 최소 15개로 만듦 (Loop 안정성 확보)
    const multiplier = Math.ceil(15 / sales.length);
    return Array(multiplier)
      .fill(sales)
      .flat()
      .slice(0, Math.max(15, sales.length * 2));
  }, [sales]);

  const SliderHeader = () => (
    <div className="mb-14 flex flex-col border-b border-stone-200 pb-5 sm:pb-6 relative z-10">
      <Link href={PATHS.BOOK_MARKET} className="group flex justify-between items-end">
        <div className="pr-4">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] text-stone-900 font-medium tracking-tight break-keep leading-tight">
            <span className="block sm:inline sm:mr-3 text-[22px] sm:text-4xl lg:text-[40px] text-stone-400 font-light mb-1 sm:mb-0">
              {t("title_prefix")}
            </span>
            {t("title_suffix")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-500 font-light break-keep">
            {t("desc")}
          </p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-stone-300 group-hover:bg-stone-900 group-hover:border-stone-900 transition-all duration-500 ml-2 shrink-0">
          <ArrowRight className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors duration-500 -rotate-45 group-hover:rotate-0" strokeWidth={1.5} />
        </div>
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <section className="w-full py-16  overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
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
      <div className="max-w-7xl mx-auto px-4">
        <SliderHeader />
      </div>
      <Swiper
        modules={[Autoplay]}
        slidesPerView={"auto"}
        spaceBetween={24}
        loop={true}
        loopAdditionalSlides={5} // 데이터 복제 + 적절한 버퍼로 완벽한 Loop 구현
        centeredSlides={true}
        speed={800}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        observer={true}
        observeParents={true}
        className="px-4! overflow-visible! [clip-path:inset(-100px_-10px)]"
      >
        {displaySales.map((sale, index) => (
          <SwiperSlide
            key={`${sale.id}-${index}`}
            className="w-[200px]! py-4 select-none"
          >
            <RecentSaleCard sale={sale} priority={index < 4} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};
