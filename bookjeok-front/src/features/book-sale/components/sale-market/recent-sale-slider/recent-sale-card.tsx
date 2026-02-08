"use client";

import { Clock, MapPin } from "lucide-react";
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
 * 세로형 포스터 스타일로 시각적 임팩트를 강화
 */
export const RecentSaleCard = ({
  sale,
  priority = false,
}: RecentSaleCardProps) => {
  const tCommon = useTranslations("common");
  // 책 이미지 우선, 없으면 판매글 이미지 사용
  const displayImage = sale.imageUrls[0] || sale.book?.image;

  return (
    <Link
      href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
      className="group block w-full"
      passHref
    >
      <div className="relative w-[200px] h-[280px] rounded-2xl overflow-hidden shadow-lg transition-all duration-500 ease-out transform-gpu hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25">
        {/* 배경 이미지 */}
        <Image
          src={displayImage || "/images/placeholder-book.svg"}
          alt={sale.title}
          fill
          sizes="200px"
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

        {/* 가격 배지 */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 text-xs font-bold text-white bg-black/60 backdrop-blur-sm rounded-full">
            {sale.price.toLocaleString()}
            {tCommon("won")}
          </span>
        </div>

        {/* 하단 정보 영역 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          {/* 책 제목 */}
          <h3 className="text-base font-bold leading-tight line-clamp-2 drop-shadow-lg mb-2 text-white transition-colors duration-300">
            {sale.book?.title || sale.title}
          </h3>

          {/* 저자 정보 */}
          {sale.book?.author && (
            <p className="text-xs text-gray-300 truncate mb-2 opacity-80">
              {sale.book.author}
            </p>
          )}

          {/* 위치 정보 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {sale.city} {sale.district}
            </span>
          </div>
        </div>

        {/* 호버 시 테두리 효과 */}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-emerald-400/50 transition-all duration-300" />
      </div>
    </Link>
  );
};
