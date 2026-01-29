import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { reviewKeys } from "@/features/review";
import { getPopularReviews, getReviewFeeds } from "@/features/review/apis";
import { getQueryClient } from "@/shared/libs/query-client";
import { ReviewHomeView } from "@/views/review-home-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "review.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title") + " | 북적",
      description: t("description"),
      images: ["/logo-og.png"],
    },
    twitter: {
      card: "summary",
      title: t("title") + " | 북적",
      description: t("description"),
      images: ["/logo-og.png"],
    },
  };
}

export const revalidate = 60;

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const queryClient = getQueryClient();

  // 인기 리뷰 및 피드 데이터 프리패치

  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: reviewKeys.popular.queryKey,
        queryFn: getPopularReviews,
      }),
      queryClient.prefetchQuery({
        queryKey: reviewKeys.feeds.queryKey,
        queryFn: getReviewFeeds,
      }),
    ]);
  } catch (error) {
    console.error("리뷰 홈 데이터 프리패치 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReviewHomeView />
    </HydrationBoundary>
  );
}
