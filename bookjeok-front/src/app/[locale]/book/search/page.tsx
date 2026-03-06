import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { bookKeys } from "@/features/book";
import { getPopularKeywords } from "@/features/book/apis";
import { getQueryClient } from "@/shared/libs/query-client";
import BookSearchView from "@/views/book-search-view";

// 5분마다 인기 검색어 갱신
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "book.search.metadata",
  });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      images: ["/logo-og-sketch.png"],
    },
    twitter: {
      card: "summary",
      title: t("title"),
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

  // 인기 검색어 프리패치 (5분 캐싱)
  try {
    await queryClient.prefetchQuery({
      queryKey: bookKeys.popularKeywords.queryKey,
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
