import { useTranslations } from "next-intl";

interface BookDescriptionProps {
  description: string;
}

export const BookDescription = ({ description }: BookDescriptionProps) => {
  const t = useTranslations("book.detail");

  return (
    <div className="space-y-4 text-base leading-relaxed text-gray-700">
      <h3 className="text-lg font-semibold">{t("description_title")}</h3>
      <p className="whitespace-pre-wrap">{description}</p>
    </div>
  );
};
