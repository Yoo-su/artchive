import { useTranslations } from "next-intl";

interface BookDescriptionProps {
  description: string;
}

// 도서 소개
export const BookDescription = ({ description }: BookDescriptionProps) => {
  const t = useTranslations("book.detail");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px w-6 bg-stone-300" />
        <h3 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          {t("description_title")}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-stone-600 whitespace-pre-wrap">
        {description}
      </p>
    </div>
  );
};
