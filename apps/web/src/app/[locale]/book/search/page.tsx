import { bookKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPopularKeywords } from "@/features/book/apis";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { publicAxios } from "@/shared/libs/axios";
import BookSearchView from "@/views/book-search-view";

export const revalidate = 3600;

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

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/book/search",
    noIndex: true,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 인기 검색어 프리패치 (5분 캐싱)
  const queries = [
    {
      queryKey: bookKeys.popularKeywords.queryKey,
      queryFn: () => getPopularKeywords(publicAxios),
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <BookSearchView />
    </ServerQueryBoundary>
  );
}
