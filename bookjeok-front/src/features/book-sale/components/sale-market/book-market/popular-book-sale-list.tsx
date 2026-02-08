import { useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { usePopularBookSalesQuery } from "../../../queries";
import { BookSale } from "../../common/book-sale-item";

export function PopularBookSaleList() {
  const t = useTranslations("market.popular");
  const { data: sales, isLoading, isError } = usePopularBookSalesQuery();

  if (isLoading) {
    return (
      <section className="mb-16">
        <header className="mb-8">
          <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            {t("title")}
          </h2>
        </header>

        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[70%] sm:min-w-[40%] md:min-w-[30%] lg:min-w-[22%]"
            >
              <BookSale.Skeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError || !sales || sales.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">
      <header className="mb-4 md:mb-8 flex items-baseline justify-between border-b border-stone-100 pb-3 md:pb-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
          {t("title")}
        </h2>
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
            <BookSale.Root sale={sale} rank={index + 1} priority={index < 4}>
              <BookSale.Image />
              <BookSale.Content>
                <BookSale.Title />
                <BookSale.Price />
                <BookSale.Location />
                <BookSale.Meta />
              </BookSale.Content>
            </BookSale.Root>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
