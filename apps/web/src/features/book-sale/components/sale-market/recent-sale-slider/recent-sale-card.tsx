"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import { UsedBookSale } from "@/features/book-sale/types";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface RecentSaleCardProps {
  sale: UsedBookSale;
  priority?: boolean;
}

/**
 * 메인페이지 최신 중고책 슬라이더에서 사용되는 카드 컴포넌트
 * 배경 이미지 위에 판매 정보를 오버레이 표시
 */
export const RecentSaleCard = ({
  sale,
  priority = false,
}: RecentSaleCardProps) => {
  const tCommon = useTranslations("common");
  // 판매글 이미지 우선, 없으면 책 이미지 사용
  const displayImage = sale.imageUrls[0] || sale.book?.image;

  return (
    <Link
      href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
      className="group block w-full"
      passHref
    >
      <div className="relative w-[200px] h-[280px] overflow-hidden transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-0.5">
        {/* 배경 이미지 */}
        <Image
          src={displayImage || "/images/placeholder-book.svg"}
          alt={sale.title}
          fill
          sizes="200px"
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />

        {/* 가격 */}
        <div className="absolute top-3 right-3">
          <span className="text-[11px] font-medium text-white/90">
            {sale.price.toLocaleString()}
            {tCommon("won")}
          </span>
        </div>

        {/* 하단 정보 영역 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {/* 판매글 제목 */}
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 drop-shadow-sm mb-1.5">
            {sale.title}
          </h3>

          {/* 책 제목 */}
          <p className="text-[11px] text-white/60 truncate font-light mb-1">
            {sale.book?.title}
          </p>

          {/* 저자 */}
          {sale.book?.author && (
            <p className="text-[10px] text-white/40 truncate font-light mb-2">
              {sale.book.author}
            </p>
          )}

          {/* 위치 정보 */}
          <p className="text-[10px] text-white/50 truncate font-light">
            {sale.city} {sale.district}
          </p>
        </div>
      </div>
    </Link>
  );
};
