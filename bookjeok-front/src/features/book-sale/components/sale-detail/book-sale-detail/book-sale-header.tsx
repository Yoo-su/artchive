import { Clock, Eye, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatPostDate } from "@/shared/utils/date";

import { UsedBookSale } from "../../../types";
import { SaleStatusBadge } from "../../common/sale-status-badge";

interface BookSaleHeaderProps {
  sale: UsedBookSale;
}

/** 판매글 헤더: 판매상태 뱃지 + 제목 + 가격 + 메타 태그(지역/날짜/조회수) */
export const BookSaleHeader = ({ sale }: BookSaleHeaderProps) => {
  const t = useTranslations("market.detail");
  const tCommon = useTranslations("common");

  const displayDate =
    sale.updatedAt > sale.createdAt ? sale.updatedAt : sale.createdAt;
  const dateLabel =
    sale.updatedAt > sale.createdAt ? t("status.edited") : t("status.created");

  const discountRate =
    Number(sale.book.discount) > 0
      ? Math.round(
          ((Number(sale.book.discount) - sale.price) /
            Number(sale.book.discount)) *
            100,
        )
      : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <SaleStatusBadge status={sale.status} />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
        {sale.title}
      </h1>
      <p className="mt-3 text-2xl font-bold text-emerald-600">
        {sale.price.toLocaleString()}
        {tCommon("won")}
        {discountRate > 0 && (
          <span className="ml-3 text-lg font-medium text-stone-400 line-through">
            {Number(sale.book.discount).toLocaleString()}
            {tCommon("won")}
          </span>
        )}
      </p>

      {/* 메타 정보 영역: 필(pill) 태그 스타일 */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <MapPin className="w-3 h-3" />
          {sale.city} {sale.district}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <Clock className="w-3 h-3" />
          {dateLabel} {formatPostDate(displayDate)}
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <Eye className="w-3 h-3" />
          {sale.viewCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
