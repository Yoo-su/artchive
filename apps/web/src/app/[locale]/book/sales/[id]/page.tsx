import { getBookSaleDetail } from "@bookjeok/api-client";
import { bookSaleKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { BookSaleJsonLd } from "@/features/book-sale/components/common/book-sale-json-ld";
import { BreadcrumbJsonLd } from "@/shared/components/breadcrumb-json-ld";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookSaleDetailView } from "@/views/book-sale-detail-view";

// 판매 상태 변경이 빠르게 반영되도록 5분 간격으로 재검증
export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

// React.cache를 사용하여 API 요청 중복 제거
const getCachedBookSale = cache(async (id: string) => {
  return await getBookSaleDetail(id);
});

// 동적 메타데이터 생성
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: "market.detail" });

  try {
    const sale = await getCachedBookSale(id);

    if (!sale) {
      return {
        title: t("not_found"),
        description: t("not_found"),
      };
    }

    const title = sale.title;
    const description = `${sale.book.title} | ${sale.price.toLocaleString()}원 | ${sale.city} ${sale.district}`;
    const images =
      sale.imageUrls.length > 0
        ? [sale.imageUrls[0]]
        : sale.book.image
          ? [sale.book.image]
          : [];

    const baseMeta = createPageMetadata({
      title,
      description,
      imageUrl: images[0],
      locale,
      path: `/book/sales/${id}`,
    });

    return {
      ...baseMeta,
      openGraph: {
        ...baseMeta.openGraph,
        type: "article",
      },
    };
  } catch {
    return createPageMetadata({
      title: t("book_info.title"),
      description: t("not_found"),
    });
  }
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const queryClient = getQueryClient();

  let sale = null;

  try {
    // 캐시된 API 호출
    sale = await getCachedBookSale(id);
  } catch (error) {
    console.error("판매글 상세 정보 조회 중 오류 발생:", error);
  }

  if (!sale) {
    notFound();
  }

  // QueryClient에 데이터 설정
  queryClient.setQueryData(bookSaleKeys.saleDetail(id).queryKey, sale);

  const t = await getTranslations({ locale, namespace: "header" });
  const breadcrumbs = [
    { name: locale === "ko" ? "홈" : "Home", url: `/${locale}` },
    { name: t("nav.menu_market"), url: `/${locale}/book/market` },
    { name: sale.title, url: `/${locale}/book/sales/${id}` },
  ];

  return (
    <ServerQueryBoundary queryClient={queryClient}>
      <BookSaleJsonLd sale={sale} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <BookSaleDetailView saleId={id} />
    </ServerQueryBoundary>
  );
}
