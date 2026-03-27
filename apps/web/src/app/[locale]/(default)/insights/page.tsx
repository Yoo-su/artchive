import { insightsKeys } from "@bookjeok/react-query/insights/keys";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { getInsights } from "@/features/insights/apis";
import { getQueryClient } from "@/shared/libs/query-client";
import InsightsView from "@/views/insights-view";

// 30분마다 데이터 재검증
export const revalidate = 1800;

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "insights.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title") + " | 북적", // Assuming "북적" is static or comes from another translation
      description: t("description"),
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

  // 인사이트 데이터 프리패치
  try {
    await queryClient.prefetchQuery({
      queryKey: insightsKeys.all.queryKey,
      queryFn: getInsights,
    });
  } catch (error) {
    console.error("인사이트 데이터 프리패치 중 오류 발생:", error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InsightsView />
    </HydrationBoundary>
  );
}
