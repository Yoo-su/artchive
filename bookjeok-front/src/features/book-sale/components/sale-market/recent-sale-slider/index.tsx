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
    <div className="text-left mb-12">
      <div className="mb-4">
        <span className="inline-block px-4 py-1.5 text-xs font-semibold tracking-wider text-emerald-600 uppercase bg-emerald-50 rounded-full">
          {t("badge")}
        </span>
      </div>
      <Link href={PATHS.BOOK_MARKET} className="group inline-block">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl group-hover:text-emerald-700 transition-colors">
          <span className="text-emerald-800">{t("title_prefix")}</span>{" "}
          {t("title_suffix")}
          <ArrowRight className="inline-block w-6 h-6 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </h2>
      </Link>
      <p className="mt-4 text-lg text-gray-500 max-w-2xl whitespace-pre-line">
        {t("desc")}
      </p>
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
