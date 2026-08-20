"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { useRecentBookSalesQuery } from "@/features/book-sale/queries";
import {
  InfiniteImageField,
  InfiniteImageItem,
} from "@/shared/components/componentry/infinite-image-field";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { RecentSaleCard } from "./recent-sale-card";
import { RecentSalesSliderSkeleton } from "./skeleton";

export const RecentSalesSlider = () => {
  const t = useTranslations("home.sections.recent_sales");
  const { data: sales, isLoading, isError } = useRecentBookSalesQuery();
  const router = useRouter();

  // PC 무한 이미지 필드용 데이터 가공
  const imageItems: InfiniteImageItem[] = useMemo(
    () =>
      (sales || []).map((sale) => ({
        id: sale.id,
        image:
          sale.imageUrls[0] ||
          sale.book?.image ||
          "/images/placeholder-image.svg",
        title: sale.title,
        price: sale.price,
        author: sale.book?.author,
        city: sale.city,
        district: sale.district,
      })),
    [sales]
  );

  const SliderHeader = () => (
    <div className="mb-14 flex flex-col border-b border-stone-200 pb-5 sm:pb-6 relative z-10 text-right">
      <Link
        href={PATHS.BOOK_MARKET}
        className="group flex justify-between items-end w-full relative z-10"
      >
        <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-stone-300 group-hover:bg-stone-900 group-hover:border-stone-900 transition-all duration-500 shrink-0">
          <ArrowLeft
            className="w-5 h-5 text-stone-500 group-hover:text-white transition-colors duration-500 rotate-45 group-hover:rotate-0"
            strokeWidth={1.5}
          />
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
      <section className="w-full py-16 overflow-hidden">
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

        {/* 1. PC / 태블릿 뷰: 있는 듯 없는 듯 극도로 은은한 마이크로 페이드 & 직각 글래스 림 */}
        <div className="hidden md:block relative w-full h-[460px] lg:h-[520px] bg-[#1c1c1c] border border-white/8 shadow-lg overflow-hidden">
          <InfiniteImageField
            items={imageItems}
            imageWidth={180}
            imageHeight={250}
            gap={26}
            maxSpeed={4.5}
            smoothing={0.06}
            borderRadius={0}
            onItemClick={(item) =>
              router.push(PATHS.BOOK_SALES_DETAIL(String(item.id)))
            }
          />

          {/* 극도로 은은한 가장자리 마이크로 페이드 (있는 듯 없는 듯 부드러운 감쇠) */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-[#1c1c1c]/50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-[#1c1c1c]/50 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8 sm:h-10 bg-gradient-to-b from-[#1c1c1c]/40 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 sm:h-16 bg-gradient-to-t from-[#1c1c1c]/60 via-[#1c1c1c]/25 to-transparent z-10" />

          {/* 하단 안내 가이드 바 */}
          <div className="pointer-events-none absolute bottom-5 left-6 z-20 flex items-center gap-3">
            <span className="text-xs font-sans text-neutral-300 bg-neutral-900/80 backdrop-blur-md px-3.5 py-1.5 border border-white/10 shadow-sm">
              {t("field_guide")}
            </span>
          </div>

          {/* 우하단 마켓 전체보기 링크 */}
          <div className="absolute bottom-5 right-6 z-20">
            <Link
              href={PATHS.BOOK_MARKET}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 bg-white/95 hover:bg-white text-neutral-950 border border-white shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              {t("view_all_button")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 2. 모바일 뷰: 터치 친화적 가로 슬라이더 */}
        <div className="block md:hidden">
          <Swiper
            modules={[Autoplay]}
            slidesPerView={"auto"}
            spaceBetween={14}
            loop={false}
            speed={600}
            autoplay={
              sales.length > 3
                ? {
                    delay: 3500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }
                : false
            }
            className="w-full overflow-visible py-2"
          >
            {sales.map((sale, index) => (
              <SwiperSlide key={sale.id} className="w-[200px]! select-none">
                <RecentSaleCard sale={sale} priority={index < 3} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="mt-4 pt-3 border-t border-neutral-200 text-center">
            <Link
              href={PATHS.BOOK_MARKET}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-neutral-950"
            >
              {t("mobile_view_all")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};


