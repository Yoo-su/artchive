import { bookKeys, bookSaleKeys, HOME_PUBLISHERS, reviewKeys } from "@bookjeok/core";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPopularBooks } from "@/features/book/apis";
import { getPublisherBooksServer } from "@/features/book/apis/server";
import { getRecentBookSales } from "@/features/book-sale/apis";
import { getReviews } from "@/features/review/apis";
import { publicAxios } from "@/shared/libs/axios";
import { getQueryClient } from "@/shared/libs/query-client";
import { HomeView } from "@/views/home-view";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    description: t("description"),
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

  try {
    await Promise.all([
      // 최근 판매글
      queryClient.prefetchQuery({
        queryKey: bookSaleKeys.recentSales.queryKey,
        queryFn: getRecentBookSales,
      }),
      // 인기 도서
      queryClient.prefetchQuery({
        queryKey: bookKeys.popularBooks.queryKey,
        queryFn: () => getPopularBooks(publicAxios),
      }),
      // 최신 리뷰 (1페이지, 10개)
      queryClient.prefetchQuery({
        queryKey: reviewKeys.list({ page: 1, limit: 10 }).queryKey,
        queryFn: () => getReviews({ page: 1, limit: 10 }),
      }),
      // 민음사 도서 목록 (초기 로딩 최적화)
      queryClient.prefetchQuery({
        queryKey: bookKeys.list({
          query: HOME_PUBLISHERS[0],
          display: 10,
        }).queryKey,
        queryFn: () => getPublisherBooksServer(HOME_PUBLISHERS[0], 10),
      }),
    ]);
  } catch (error) {
    console.error("홈 페이지 데이터 프리패치 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
}
