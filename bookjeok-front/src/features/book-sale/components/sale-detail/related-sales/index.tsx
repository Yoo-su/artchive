"use client";

import { useTranslations } from "next-intl";
import { useInView } from "react-intersection-observer";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { useRelatedSalesQuery } from "../../../queries";
import { BookSale } from "../../common/book-sale-item";
import { RelatedSalesSkeleton } from "./skeleton";

interface RelatedSalesProps {
  isbn: string;
}

/**
 * 책 상세페이지 관련 판매글 섹션
 * - 최대 4개 표시 + 더보기 링크
 * - 슬라이더 형태
 */
export const RelatedSales = ({ isbn }: RelatedSalesProps) => {
  const t = useTranslations("market.detail.related");
  // 뷰포트 진입 시 데이터 로딩
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });

  const { data, isLoading, isError } = useRelatedSalesQuery({
    isbn,
    limit: 4,
    enabled: inView,
  });

  const sales = data?.sales || [];
  const totalCount = data?.total || 0;

  return (
    <section ref={ref} className="w-full py-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl text-stone-600">{t("title")}</h2>

        {totalCount > 4 && (
          <Link href={`${PATHS.BOOK_MARKET}?isbn=${isbn}`}>
            <Button variant="ghost" size="sm" className="text-stone-500">
              {t("more")} ({totalCount}개)
            </Button>
          </Link>
        )}
      </div>

      {/* 로딩 상태 */}
      {(!inView || isLoading) && <RelatedSalesSkeleton />}

      {/* 에러 상태 */}
      {isError && (
        <div className="text-center text-red-500 py-8">{t("error")}</div>
      )}

      {/* 빈 상태 */}
      {inView && !isLoading && !isError && sales.length === 0 && (
        <div className="text-center py-12 bg-stone-50 rounded-xl">
          <p className="text-stone-500 mb-4">{t("empty")}</p>
          <Link href={PATHS.BOOK_SALES_REGISTER}>
            <Button variant="outline" size="sm">
              {t("register_first")}
            </Button>
          </Link>
        </div>
      )}

      {/* 슬라이더 */}
      {inView && !isLoading && !isError && sales.length > 0 && (
        <Swiper
          modules={[Autoplay]}
          slidesPerView="auto"
          spaceBetween={16}
          className="w-full overflow-visible! [clip-path:inset(-100px_-10px)]"
        >
          {sales.map((sale, index) => (
            <SwiperSlide key={sale.id} className="w-[260px]! select-none">
              <BookSale.Root sale={sale}>
                <BookSale.Image />
                <BookSale.Content>
                  <BookSale.Title />
                  <BookSale.Price />
                  <BookSale.Location />
                  <BookSale.Meta />
                </BookSale.Content>
                <BookSale.Effect delay={index * 10} />
              </BookSale.Root>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
};
