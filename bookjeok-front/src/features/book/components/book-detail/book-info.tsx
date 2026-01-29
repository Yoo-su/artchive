import { useTranslations } from "next-intl";

import { Badge } from "@/shared/components/shadcn/badge";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";

interface BookInfoProps {
  title: string;
  author: string;
  publisher: string;
  price: number;
}

export const BookInfo = ({
  title,
  author,
  publisher,
  price,
}: BookInfoProps) => {
  const t = useTranslations("book.detail");
  return (
    <div className="flex flex-col gap-4">
      <Badge variant="secondary" className="w-fit">
        {t("domestic_book")}
      </Badge>
      <div>
        <h1 className="text-3xl font-bold tracking-tighter text-gray-900 lg:text-4xl">
          {title}
        </h1>
        <p className="flex flex-wrap items-center gap-2 mt-2 text-lg text-gray-600">
          <Link
            href={`/book/search?q=${author}`}
            className="hover:text-primary hover:underline"
          >
            {author}
          </Link>
          <span>{t("author_suffix")}</span>
          <span>|</span>
          <Link
            href={`/book/search?q=${publisher}`}
            className="hover:text-primary hover:underline"
          >
            {publisher}
          </Link>
        </p>
      </div>

      <div className="mt-2">
        <PriceDisplay value={price} size="xl" />
      </div>
    </div>
  );
};
