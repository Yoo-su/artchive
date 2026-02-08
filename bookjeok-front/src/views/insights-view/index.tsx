"use client";

import { useTranslations } from "next-intl";

import { ActivityTrendChart } from "@/features/insights/components/charts/activity-trend-chart";
import { CategoryChart } from "@/features/insights/components/charts/category-chart";
import { LocationHeatmap } from "@/features/insights/components/charts/location-heatmap";
import { PriceHistogram } from "@/features/insights/components/charts/price-histogram";
import { ReactionDonutChart } from "@/features/insights/components/charts/reaction-donut-chart";
import { InsightsHeader } from "@/features/insights/components/common/insights-header";
import { PopularTagsList } from "@/features/insights/components/lists/popular-tags-list";
import { useInsightsQuery } from "@/features/insights/queries";
import { FullScreenLoader } from "@/shared/components/ui/full-screen-loader";

/**
 * 인사이트 페이지 메인 뷰
 */
export const InsightsView = () => {
  const t = useTranslations("insights");
  const { data, isLoading, isError } = useInsightsQuery();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg font-medium text-gray-900">
            {t("error.title")}
          </p>
          <p className="text-sm text-gray-500">{t("error.desc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 pt-6 md:pt-12">
      {/* 헤더 및 요약 */}
      <InsightsHeader summary={data.summary} />

      {/* 섹션별 구분 */}
      <div className="space-y-6">
        {/* 지도 섹션 */}
        <LocationHeatmap data={data.locationStats} />

        {/* 활동 추이 */}
        <ActivityTrendChart data={data.activityTrend} />

        {/* 2열 그리드: 카테고리 + 가격 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 카테고리별 리뷰 */}
          <CategoryChart data={data.categoryStats} />

          {/* 가격 분포 */}
          <PriceHistogram data={data.priceDistribution} />
        </div>

        {/* 리액션 분포 */}
        <ReactionDonutChart data={data.reactionStats} />

        {/* 인기 태그 */}
        <PopularTagsList data={data.popularTags} />
      </div>
    </div>
  );
};

export default InsightsView;
