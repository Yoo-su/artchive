import { insightsKeys } from "@bookjeok/core";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getInsights } from "@/features/insights/apis";
import { ServerQueryBoundary } from "@/shared/components/server-query-boundary";
import { createPageMetadata } from "@/shared/config/metadata";
import InsightsView from "@/views/insights-view";

// 6시간마다 데이터 재검증
export const revalidate = 21600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "insights.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ServerQueryBoundary
      queries={[{ queryKey: insightsKeys.all.queryKey, queryFn: getInsights }]}
    >
      <InsightsView />
    </ServerQueryBoundary>
  );
}
