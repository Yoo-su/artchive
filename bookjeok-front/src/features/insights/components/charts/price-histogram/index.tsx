"use client";

import { DollarSign } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/common/insight-card";
import {
  CHART_COLORS,
  PRICE_RANGE_LABELS,
} from "@/features/insights/constants";
import { PriceRangeStat } from "@/features/insights/types";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-400 border-t-transparent" />
    </div>
  ),
});

interface PriceHistogramProps {
  data: PriceRangeStat[];
}

/**
 * 가격 분포 히스토그램
 */
export const PriceHistogram = ({ data }: PriceHistogramProps) => {
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
          borderRadius: 8,
          columnWidth: "60%",
        },
      },
      colors: [CHART_COLORS.quaternary],
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.3,
          opacityFrom: 1,
          opacityTo: 0.8,
        },
      },
      dataLabels: {
        enabled: true,
        offsetY: -20,
        style: {
          fontSize: "12px",
          colors: ["#374151"],
        },
        formatter: (val: number) => (val > 0 ? val.toString() : ""),
      },
      xaxis: {
        categories: data.map(
          (item) => PRICE_RANGE_LABELS[item.range] || item.range,
        ),
        labels: {
          style: {
            colors: "#6b7280",
            fontSize: "11px",
          },
          rotate: -45,
          rotateAlways: false,
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
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val}개 판매글`,
        },
      },
    }),
    [data],
  );

  const series = useMemo(
    () => [
      {
        name: "판매글 수",
        data: data.map((item) => item.count),
      },
    ],
    [data],
  );

  return (
    <InsightCard
      title="가격 분포"
      description="어떤 가격대가 가장 인기 있을까요?"
      icon={<DollarSign className="h-5 w-5" />}
    >
      {hasData ? (
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="bar"
          height={280}
        />
      ) : (
        <EmptyState message="아직 등록된 판매글이 없어요" />
      )}
    </InsightCard>
  );
};
