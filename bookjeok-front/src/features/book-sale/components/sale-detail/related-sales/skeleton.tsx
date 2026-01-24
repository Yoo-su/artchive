import { Swiper, SwiperSlide } from "swiper/react";

import { BookSale } from "../../common/book-sale-item";

export function RelatedSalesSkeleton() {
  return (
    <div className="mt-8">
      <Swiper spaceBetween={16} slidesPerView={"auto"} className="p-1!">
        {[...Array(4)].map((_, i) => (
          <SwiperSlide key={i} className="w-[250px]! py-8 select-none">
            <BookSale.Skeleton />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
