"use client";

import { AlertTriangle, BookX } from "lucide-react";
import { useTranslations } from "next-intl";

import { useMyBookSalesQuery } from "../../../queries";
import { BookSaleHistoryItem } from "./item";
import { BookSaleHistoryListSkeleton } from "./skeleton";

export const BookSaleHistoryList = () => {
  const t = useTranslations("market.history");
  const { data: sales, isLoading, isError } = useMyBookSalesQuery();

  if (isLoading) {
    return <BookSaleHistoryListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-red-500 bg-red-50 p-8 rounded-lg">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <p className="font-semibold">{t("error_title")}</p>
        <p className="text-sm">{t("error_desc")}</p>
      </div>
    );
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-gray-500 bg-gray-50 p-8 rounded-lg">
        <BookX className="w-12 h-12 mb-4" />
        <p className="font-semibold">{t("empty_title")}</p>
        <p className="text-sm">{t("empty_desc")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sales.map((sale) => (
        <BookSaleHistoryItem key={sale.id} sale={sale} />
      ))}
    </div>
  );
};
