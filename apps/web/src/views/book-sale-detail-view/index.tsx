"use client";

import { BookSaleDetail } from "@/features/book-sale/components/sale-detail/book-sale-detail";

interface BookSaleDetailViewProps {
  saleId: string;
}

export const BookSaleDetailView = ({ saleId }: BookSaleDetailViewProps) => {
  return <BookSaleDetail saleId={saleId} />;
};
