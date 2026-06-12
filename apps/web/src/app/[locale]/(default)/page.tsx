import {
  bookKeys,
  bookSaleKeys,
  HOME_PUBLISHERS,
  readingLogKeys,
  reviewKeys,
} from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPopularBooks } from "@/features/book/apis";
import { getPublisherBooksServer } from "@/features/book/apis/server";
import { getRecentBookSales } from "@/features/book-sale/apis";
import { getLoungePopular } from "@/features/reading-log/apis";
import { getReviews } from "@/features/review/apis";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { publicAxios } from "@/shared/libs/axios";
import { HomeView } from "@/views/home-view";

export const revalidate = 3600;

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

  const queries = [
    {
      queryKey: bookSaleKeys.recentSales.queryKey,
      queryFn: getRecentBookSales,
    },
    {
      queryKey: bookKeys.popularBooks.queryKey,
      queryFn: () => getPopularBooks(publicAxios),
    },
    {
      queryKey: reviewKeys.list({ page: 1, limit: 5 }).queryKey,
      queryFn: () => getReviews({ page: 1, limit: 5 }),
    },
    {
      queryKey: bookKeys.list({
        query: HOME_PUBLISHERS[0],
        display: 10,
      }).queryKey,
      queryFn: () => getPublisherBooksServer(HOME_PUBLISHERS[0], 10),
    },
    {
      queryKey: readingLogKeys.loungePopular.queryKey,
      queryFn: getLoungePopular,
    },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <HomeView />
    </ServerQueryBoundary>
  );
}
