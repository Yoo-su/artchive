import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getPopularBookSales, searchBookSales } from "@/features/book/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import { BookMarketView } from "@/views/book-market-view";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "중고책 마켓",
  description:
    "다양한 중고 서적을 탐색하고 저렴하게 구매하세요. 지역별 중고책 거래, 판매 등록까지 한 번에. 베스트셀러부터 희귀본까지 북적 중고마켓에서 만나보세요.",
  keywords: [
    "북적 중고책",
    "북적 중고서적",
    "중고책",
    "중고 도서",
    "중고책 거래",
    "중고책 판매",
    "중고책 구매",
    "중고서적",
  ],
  openGraph: {
    title: "중고책 마켓 | 북적",
    description: "중고책을 사고파는 가장 쉬운 방법",
    images: ["/logo-og.png"],
  },
  twitter: {
    card: "summary",
    title: "중고책 마켓 | 북적",
    description: "중고책을 사고파는 가장 쉬운 방법",
    images: ["/logo-og.png"],
  },
};

export default async function Page() {
  const queryClient = getQueryClient();

  // 인기 판매글 및 초기 판매글 목록 prefetch
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.bookKeys.popularSales.queryKey,
        queryFn: getPopularBookSales,
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: QUERY_KEYS.bookKeys.marketSales({}).queryKey,
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
