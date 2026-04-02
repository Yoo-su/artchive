import { reviewKeys } from "@bookjeok/core";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPopularReviews, getReviewFeeds } from "@/features/review/apis";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import { ReviewHomeView } from "@/views/review-home-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "review.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export const revalidate = 3600;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const queries = [
    { queryKey: reviewKeys.popular.queryKey, queryFn: getPopularReviews },
    { queryKey: reviewKeys.feeds().queryKey, queryFn: getReviewFeeds },
  ];

  return (
    <ServerQueryBoundary queries={queries}>
      <ReviewHomeView />
    </ServerQueryBoundary>
  );
}
