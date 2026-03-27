import { UsedBookSale } from "@bookjeok/core/book-sale";
import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/shadcn/card";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface BookInfoCardProps {
  sale: UsedBookSale;
}

export const BookInfoCard = ({ sale }: BookInfoCardProps) => {
  const t = useTranslations("market.detail.book_info");

  return (
    <Link href={PATHS.BOOK_DETAIL(sale.book.isbn)}>
      <Card className="transition-shadow bg-gray-50 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative w-20 h-[120px] shrink-0">
              <Image
                src={sale.book.image}
                alt={sale.book.title}
                fill
                sizes="80px"
                className="object-cover rounded-md"
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-gray-800">{sale.book.title}</p>
              <p className="text-gray-600">
                {t("author")}: {sale.book.author}
              </p>
              <p className="text-gray-600">
                {t("publisher")}: {sale.book.publisher}
              </p>
              <p className="text-gray-500 pt-1 line-clamp-2">
                {sale.book.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
