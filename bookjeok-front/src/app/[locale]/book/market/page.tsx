import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  getPopularBookSales,
  searchBookSales,
} from "@/features/book-sale/apis";
import { bookSaleKeys } from "@/features/book-sale/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookMarketView } from "@/views/book-market-view";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "market.hero.metadata",
  });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title") + " | 북적",
      description: t("description"),
      images: ["/logo-og-sketch.png"],
    },
    twitter: {
      card: "summary",
      title: t("title") + " | 북적",
      description: t("description"),
      images: ["/logo-og-sketch.png"],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const queryClient = getQueryClient();

  // 인기 판매글 및 판매 목록 프리패치
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: bookSaleKeys.popularSales.queryKey,
        queryFn: getPopularBookSales,
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: bookSaleKeys.marketSales({}).queryKey,
        queryFn: ({ pageParam }) =>
          searchBookSales({
            page: 1,
            cursor: pageParam as string | undefined,
          }),
        initialPageParam: undefined,
      }),
    ]);
  } catch (error) {
    console.error("중고마켓 홈 데이터 프리패치 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookMarketView />
    </HydrationBoundary>
  );
}
