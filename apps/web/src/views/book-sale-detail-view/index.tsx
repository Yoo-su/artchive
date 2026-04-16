"use client";

import { BookSaleDetail } from "@/features/book-sale/components/sale-detail/book-sale-detail";
import { useSaleView } from "@/features/book-sale/hooks/use-sale-view";

interface BookSaleDetailViewProps {
  saleId: string;
}

export const BookSaleDetailView = ({ saleId }: BookSaleDetailViewProps) => {
  // 클라이언트 사이드에서 조회수 기록
  useSaleView(Number(saleId));

  return <BookSaleDetail saleId={saleId} />;
};
