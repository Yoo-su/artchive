import { useTranslations } from "next-intl";

interface BookDescriptionProps {
  description: string;
}

// 도서 소개
export const BookDescription = ({ description }: BookDescriptionProps) => {
  const t = useTranslations("book.detail");

  return (
    <div className="space-y-4">
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

      {/* 알라딘 OpenAPI 프리미엄 규정 준수: 출처 표기 */}
      <div className="pt-2 text-xs text-stone-400 font-normal">
        도서 DB 제공 :{" "}
        <a
          href="https://www.aladin.co.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-stone-600 transition-colors"
        >
          알라딘 인터넷서점(www.aladin.co.kr)
        </a>
      </div>
    </div>
  );
};
