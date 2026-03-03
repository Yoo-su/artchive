"use client";

import { useTranslations } from "next-intl";

import { Separator } from "@/shared/components/shadcn/separator";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { PATHS } from "@/shared/constants/paths";

import { useBookSaleDetailQuery } from "../../../queries";
import { BookInfoCard } from "./book-info-card";
import { BookSaleActions } from "./book-sale-actions";
import { BookSaleContent } from "./book-sale-content";
import { BookSaleHeader } from "./book-sale-header";
import { BookSaleImageCarousel } from "./book-sale-image-carousel";
import { SaleLocationMap } from "./sale-location-map";
import { BookSaleDetailSkeleton } from "./skeleton";

interface BookSaleDetailProps {
  saleId: string;
}

export const BookSaleDetail = ({ saleId }: BookSaleDetailProps) => {
  const t = useTranslations("market.detail");
  const { data: sale, isLoading, isError } = useBookSaleDetailQuery(saleId);

  if (isLoading) {
    return <BookSaleDetailSkeleton />;
  }

  if (isError || !sale) {
    return (
      <NotFoundRedirect
        message={t("not_found")}
        fallbackPath={PATHS.BOOK_MARKET}
      />
    );
  }

  // 이미지 목록: 판매자 등록 이미지가 없으면 도서 표지를 사용
  const images = sale.imageUrls.length > 0 ? sale.imageUrls : [sale.book.image];

  const AdditionalInfo = () => (
    <div className="space-y-8 mt-10">
      {sale.latitude && sale.longitude && (
        <SaleLocationMap
          latitude={sale.latitude}
          longitude={sale.longitude}
          placeName={sale.placeName}
          city={sale.city}
          district={sale.district}
        />
      )}
      <BookInfoCard sale={sale} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 md:py-12 px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <div className="space-y-8">
          <BookSaleImageCarousel images={images} alt={sale.title} />
          {/* Desktop View: 왼쪽 컬럼 하단에 배치 */}
          <div className="hidden md:block">
            <AdditionalInfo />
          </div>
        </div>

        <div className="space-y-6">
          <BookSaleHeader sale={sale} />
          <Separator />
          <BookSaleActions sale={sale} />
          <Separator />
          <BookSaleContent sale={sale} />
          {/* Mobile View: 오른쪽(모바일은 하단) 컬럼 하단에 배치 */}
          <div className="md:hidden">
            <AdditionalInfo />
          </div>
        </div>
      </div>
    </div>
  );
};
