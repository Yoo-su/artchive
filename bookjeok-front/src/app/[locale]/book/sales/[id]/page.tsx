import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { getBookSaleDetail } from "@/features/book-sale/apis";
import { BookSaleJsonLd } from "@/features/book-sale/components/common/book-sale-json-ld";
import { bookSaleKeys } from "@/features/book-sale/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookSaleDetailView } from "@/views/book-sale-detail-view";

// 판매 상태 변경이 빠르게 반영되도록 1분 간격으로 재검증
export const revalidate = 60;

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

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images,
      },
      alternates: {
        canonical: `https://bookjeok.com/book/sales/${id}`,
      },
    };
  } catch {
    return {
      title: t("book_info.title"), // Fallback if API fails
      description: t("not_found"),
    };
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

    // QueryClient에 데이터 설정
    if (sale) {
      queryClient.setQueryData(bookSaleKeys.saleDetail(id).queryKey, sale);
    }
  } catch (error) {
    console.error("판매글 상세 정보 조회 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {sale && <BookSaleJsonLd sale={sale} />}
      <BookSaleDetailView saleId={id} />
    </HydrationBoundary>
  );
}
