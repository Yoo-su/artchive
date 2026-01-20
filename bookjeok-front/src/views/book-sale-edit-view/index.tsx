"use client";

import { BookSaleEdit } from "@/features/book-sale/components/book-sale-edit";

interface BookSaleEditViewProps {
  saleId: string;
}

export const BookSaleEditView = ({ saleId }: BookSaleEditViewProps) => {
  return (
    <div className="w-full py-8">
      <BookSaleEdit saleId={saleId} />
    </div>
  );
};
