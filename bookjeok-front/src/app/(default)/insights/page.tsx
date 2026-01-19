import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata } from "next";

import { getInsights } from "@/features/insights/apis";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { getQueryClient } from "@/shared/libs/query-client";
import InsightsView from "@/views/insights-view";

// 30분마다 데이터 재검증
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "서비스 인사이트",
  description:
    "북적 서비스의 활동 현황을 한눈에 확인하세요. 거래 핫스팟, 인기 카테고리, 가격 분포 등 다양한 통계를 제공합니다.",
  openGraph: {
    title: "서비스 인사이트 | 북적",
    description:
      "북적 서비스의 활동 현황을 한눈에 확인하세요. 거래 핫스팟, 인기 카테고리, 가격 분포 등 다양한 통계를 제공합니다.",
  },
};

export default async function InsightsPage() {
  const queryClient = getQueryClient();

  // 인사이트 데이터 서버사이드 프리페치
  try {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.insightsKeys.all.queryKey,
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
