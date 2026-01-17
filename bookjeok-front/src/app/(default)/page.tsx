import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getPopularBooks, getRecentBookSales } from "@/features/book/apis";
import { getPublisherBooksServer } from "@/features/book/apis/server";
import { HOME_PUBLISHERS } from "@/features/book/constants";
import { getReviews } from "@/features/review/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { HomeView } from "@/views/home-view";

export const revalidate = 60;

export const metadata: Metadata = {
  description:
    "책과 사람을 잇는 북적에서 인기 중고책을 거래하고 솔직한 도서 리뷰를 확인하세요. 나만의 독서 경험을 공유해보세요.",
};

export default async function Page() {
  const queryClient = getQueryClient();

  await Promise.all([
    // 최근 판매글 prefetch
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.bookKeys.recentSales.queryKey,
      queryFn: getRecentBookSales,
    }),
    // 인기책 prefetch
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.bookKeys.popularBooks.queryKey,
      queryFn: getPopularBooks,
    }),
    // 최신 리뷰 prefetch (page: 1, limit: 10)
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.reviewKeys.list({ page: 1, limit: 10 }).queryKey,
      queryFn: () => getReviews({ page: 1, limit: 10 }),
    }),
    // 첫 번째 출판사(민음사) 책 목록 prefetch - MainBookSlider 초기 로딩 최적화
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.bookKeys.list({
        query: HOME_PUBLISHERS[0],
        display: 10,
      }).queryKey,
      queryFn: () => getPublisherBooksServer(HOME_PUBLISHERS[0], 10),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
}
