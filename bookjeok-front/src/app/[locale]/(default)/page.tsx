import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { bookKeys } from "@/features/book";
import { getPopularBooks } from "@/features/book/apis";
import { getPublisherBooksServer } from "@/features/book/apis/server";
import { HOME_PUBLISHERS } from "@/features/book/constants";
import { getRecentBookSales } from "@/features/book-sale/apis";
import { reviewKeys } from "@/features/review";
import { getReviews } from "@/features/review/apis";
import { getQueryClient } from "@/shared/libs/query-client";
import { HomeView } from "@/views/home-view";

export const revalidate = 60;

export const metadata: Metadata = {
  description:
    "책과 사람을 잇는 북적에서 인기 중고책을 거래하고 솔직한 도서 리뷰를 확인하세요. 나만의 독서 경험을 공유해보세요.",
};

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
        queryKey: bookKeys.recentSales.queryKey,
        queryFn: getRecentBookSales,
      }),
      // 인기 도서
      queryClient.prefetchQuery({
        queryKey: bookKeys.popularBooks.queryKey,
        queryFn: getPopularBooks,
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
