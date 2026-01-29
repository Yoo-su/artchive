import { useTranslations } from "next-intl";

import { BookSaleHistoryList } from "@/features/book-sale/components/my-sales/book-sale-history-list";

export const BookSaleHistoryView = () => {
  const t = useTranslations("market.history");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 py-4">{t("title")}</h1>
      <BookSaleHistoryList />
    </div>
  );
};
