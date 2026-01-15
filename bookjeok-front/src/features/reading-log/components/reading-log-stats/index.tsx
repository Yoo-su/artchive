"use client";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { READING_LOG_COLORS } from "../../constants";
import { useReadingLogStatsQuery } from "../../queries";

interface ReadingLogStatsProps {
  currentDate: Date;
}

export function ReadingLogStats({ currentDate }: ReadingLogStatsProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: stats, isLoading } = useReadingLogStatsQuery(year, month);

  const getMessage = (monthly: number, yearly: number) => {
    if (monthly === 0) return "이번 달 독서를 시작해보세요! 📚";
    if (monthly >= 5) return "이번 달 독서량이 대단해요! 🔥";
    if (monthly >= 3) return "꾸준히 읽고 계시네요! 멋져요 👍";
    return "좋은 책과 함께하는 시간, 소중해요 🌿";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      <div
        className="p-4 rounded-xl flex items-center justify-between border"
        style={{
          backgroundColor: READING_LOG_COLORS.matcha.bg,
          borderColor: READING_LOG_COLORS.matcha.light + "40",
        }}
      >
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {month}월의 독서
          </p>
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-bold"
              style={{ color: READING_LOG_COLORS.matcha.dark }}
            >
              {stats.monthlyCount}
            </span>
            <span className="text-sm text-gray-600">권</span>
          </div>
        </div>
        <div className="text-right">
          <p
            className="text-xs font-medium"
            style={{ color: READING_LOG_COLORS.matcha.medium }}
          >
            {getMessage(stats.monthlyCount, stats.yearlyCount)}
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl flex items-center justify-between border bg-white border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {year}년 누적
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-800">
              {stats.yearlyCount}
            </span>
            <span className="text-sm text-gray-600">권</span>
          </div>
        </div>
      </div>
    </div>
  );
}
