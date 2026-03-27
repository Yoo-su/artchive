import { useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { usePopularBookSalesQuery } from "../../../queries";
import { UsedBookSale } from "../../common/book-sale-item";

export function PopularBookSaleList() {
  const t = useTranslations("market.popular");
  const { data: sales, isLoading, isError } = usePopularBookSalesQuery();

  if (isLoading) {
    return (
      <section className="mb-16">
        <header className="mb-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-semibold text-stone-900">
              {t("title")}
            </h2>
            <span className="text-[10px] font-medium text-stone-400 tracking-wider uppercase">
              {t("badge")}
            </span>
          </div>
        </header>

        <Swiper
          modules={[FreeMode]}
          freeMode={true}
          spaceBetween={20}
          slidesPerView={1.2}
          breakpoints={{
            480: { slidesPerView: 2.1 },
            768: { slidesPerView: 3.1 },
            1024: { slidesPerView: 4.1 },
          }}
          className="w-full px-1! py-2! md:py-4!"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <SwiperSlide key={i} className="select-none h-auto">
              <UsedBookSale.Skeleton />
            </SwiperSlide>
          ))}
        </Swiper>
      </section>
    );
  }

  if (isError || !sales || sales.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <header className="mb-6">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold text-stone-900">{t("title")}</h2>
          <span className="text-[10px] font-medium text-stone-400 tracking-wider uppercase">
            {t("badge")}
          </span>
        </div>
      </header>

      <Swiper
        modules={[FreeMode]}
        freeMode={true}
        spaceBetween={20}
        slidesPerView={1.2}
        breakpoints={{
          480: { slidesPerView: 2.1 },
          768: { slidesPerView: 3.1 },
          1024: { slidesPerView: 4.1 },
        }}
        className="w-full px-1! py-2! md:py-4!"
      >
        {sales.map((sale, index) => (
          <SwiperSlide key={sale.id} className="select-none">
            <UsedBookSale.Root sale={sale} rank={index + 1} priority={index < 4}>
              <UsedBookSale.Image />
              <UsedBookSale.Content>
                <UsedBookSale.Title />
                <UsedBookSale.Price />
                <UsedBookSale.Location />
                <UsedBookSale.Meta />
              </UsedBookSale.Content>
            </UsedBookSale.Root>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
