import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getPopularKeywords } from "@/features/book/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import BookSearchView from "@/views/book-search-view";

// 5분마다 인기 검색어 갱신
export const revalidate = 300;

export const metadata: Metadata = {
  title: "도서 검색",
  description:
    "제목, 저자, 출판사로 원하는 책을 검색하세요. 책 정보 확인부터 리뷰 작성, 중고 거래까지 북적에서 한 번에.",
  keywords: [
    "도서 검색",
    "책 검색",
    "책 찾기",
    "북적 검색",
    "도서 정보",
    "책 리뷰",
    "중고책 검색",
  ],
  openGraph: {
    title: "도서 검색 | 북적",
    description: "원하는 책을 검색하고, 리뷰와 중고 거래 정보까지 확인하세요.",
    images: ["/logo-og.png"],
  },
  twitter: {
    card: "summary",
    title: "도서 검색 | 북적",
    description: "원하는 책을 검색하고, 리뷰와 중고 거래 정보까지 확인하세요.",
    images: ["/logo-og.png"],
  },
};

export default async function Page() {
  const queryClient = getQueryClient();

  // 인기 검색어 prefetch (5분 캐싱)
  try {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.bookKeys.popularKeywords.queryKey,
      queryFn: getPopularKeywords,
    });
  } catch (error) {
    console.error("인기 검색어 프리패치 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BookSearchView />
    </HydrationBoundary>
  );
}
