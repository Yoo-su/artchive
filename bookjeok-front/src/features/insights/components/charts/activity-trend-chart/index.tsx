"use client";

import { TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/common/insight-card";
import { TREND_COLORS } from "@/features/insights/constants";
import { ActivityTrendStat } from "@/features/insights/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
    </div>
  ),
});

interface ActivityTrendChartProps {
  data: ActivityTrendStat[];
}

/**
 * 일별 활동 추이 Area 차트
 */
export const ActivityTrendChart = ({ data }: ActivityTrendChartProps) => {
  const hasData = data.some(
    (item) => item.salesCount > 0 || item.reviewsCount > 0,
  );

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "area" as const,
        toolbar: { show: false },
        fontFamily: "inherit",
        zoom: { enabled: false },
      },
      colors: [TREND_COLORS.sales, TREND_COLORS.reviews],
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.1,
          stops: [0, 100],
        },
      },
      stroke: {
        curve: "smooth" as const,
        width: 2,
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: data.map((item) => {
          const date = new Date(item.date);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        labels: {
          style: {
            colors: "#6b7280",
            fontSize: "11px",
          },
          rotate: 0,
          hideOverlappingLabels: true,
        },
        tickAmount: 7,
      },
      yaxis: {
        labels: {
          style: {
            colors: "#6b7280",
            fontSize: "12px",
          },
        },
        min: 0,
      },
      grid: {
        borderColor: "#f3f4f6",
      },
      legend: {
        position: "top" as const,
        horizontalAlign: "right" as const,
        fontSize: "12px",
        markers: {
          size: 8,
          shape: "circle" as const,
        },
      },
      tooltip: {
        x: {
          format: "yyyy-MM-dd",
        },
      },
    }),
    [data],
  );

  const series = useMemo(
    () => [
      {
        name: "판매글",
        data: data.map((item) => item.salesCount),
      },
      {
        name: "리뷰",
        data: data.map((item) => item.reviewsCount),
      },
    ],
    [data],
  );

  return (
    <InsightCard
      title="최근 30일 활동 추이"
      description="서비스의 활발한 활동을 확인해보세요"
      icon={<TrendingUp className="h-5 w-5" />}
    >
      {hasData ? (
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="area"
          height={280}
        />
      ) : (
        <EmptyState message="아직 활동 데이터가 없어요" />
      )}
    </InsightCard>
  );
};
