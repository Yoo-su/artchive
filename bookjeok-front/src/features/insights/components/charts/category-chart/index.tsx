"use client";

import { BarChart3 } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/common/insight-card";
import { BAR_CHART_COLORS } from "@/features/insights/constants";
import { CategoryStat } from "@/features/insights/types";

// ApexCharts는 SSR을 지원하지 않으므로 dynamic import
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
    </div>
  ),
});

interface CategoryChartProps {
  data: CategoryStat[];
}

/**
 * 카테고리별 리뷰 수 막대 차트
 */
export const CategoryChart = ({ data }: CategoryChartProps) => {
  const hasData = data.some((item) => item.count > 0);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar" as const,
        toolbar: { show: false },
        fontFamily: "inherit",
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          distributed: true,
          dataLabels: {
            position: "top" as const,
          },
        },
      },
      colors: BAR_CHART_COLORS,
      dataLabels: {
        enabled: true,
        offsetX: 20,
        style: {
          fontSize: "12px",
          colors: ["#374151"],
        },
        formatter: (val: number) => (val > 0 ? val.toString() : ""),
      },
      xaxis: {
        categories: data.map((item) => item.category),
        labels: {
          style: {
            colors: "#6b7280",
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#6b7280",
            fontSize: "12px",
          },
        },
      },
      grid: {
        borderColor: "#f3f4f6",
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val}개 리뷰`,
        },
      },
      legend: { show: false },
    }),
    [data],
  );

  const series = useMemo(
    () => [
      {
        name: "리뷰 수",
        data: data.map((item) => item.count),
      },
    ],
    [data],
  );

  return (
    <InsightCard
      title="카테고리별 리뷰"
      description="어떤 분야의 리뷰가 가장 많을까요?"
      icon={<BarChart3 className="h-5 w-5" />}
    >
      {hasData ? (
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="bar"
          height={350}
        />
      ) : (
        <EmptyState message="아직 등록된 리뷰가 없어요" />
      )}
    </InsightCard>
  );
};
