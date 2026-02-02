"use client";

import { UsedBookSale } from "../../../types";
import { BookSaleImageCarousel } from "./book-sale-image-carousel";

interface BookSaleInfoProps {
  sale: UsedBookSale;
}

export const BookSaleInfo = ({ sale }: BookSaleInfoProps) => {
  const images = sale.imageUrls.length > 0 ? sale.imageUrls : [sale.book.image];

  return (
    <div className="space-y-6">
      <BookSaleImageCarousel images={images} alt={sale.title} />
    </div>
  );
};
