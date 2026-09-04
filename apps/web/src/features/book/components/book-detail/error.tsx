import { useTranslations } from "next-intl";

import { BookOpen } from "@/shared/components/icons/iconsax";

export const BookDetailError = () => {
  const t = useTranslations("book.detail_error");

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 bg-gray-50 rounded-lg">
      <BookOpen className="w-12 h-12 mb-4 text-gray-400" />
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="mt-2 text-sm">
        {t("desc")}
      </p>
    </div>
  );
};
