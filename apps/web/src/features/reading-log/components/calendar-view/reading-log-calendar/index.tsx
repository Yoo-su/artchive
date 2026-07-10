"use client";

import { ReadingLog } from "@bookjeok/core";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/shared/utils";

import { useReadingLogPrefetch } from "../../../hooks/use-reading-log-prefetch";
import { useSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import { useReadingLogsQuery } from "../../../queries";
import { DayDetailsDialog } from "../../common/day-details-dialog";
import { ReadingLogCardDeck } from "../../deck-view/reading-log-card-deck";
import { ReadingLogListView } from "../../list-view/reading-log-list-view";
import { ReadingLogStats } from "../../stats-view/reading-log-stats";
import { ReadingLogCalendarSkeleton } from "../reading-log-calendar-skeleton";
import {
  ReadingLogControls,
  ReadingLogViewMode,
} from "../reading-log-controls";
import { ReadingLogDayCell } from "../reading-log-day-cell";

interface ReadingLogCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  readOnly?: boolean;
  initialLogs?: ReadingLog[];
}

export function ReadingLogCalendar({
  currentDate,
  onDateChange,
  readOnly = false,
  initialLogs = [],
}: ReadingLogCalendarProps) {
  const t = useTranslations("reading_log.calendar");
  // 내부 상태는 선택된 날짜와 다이얼로그, 뷰 모드만 관리
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ReadingLogViewMode>("calendar");

  // 계절 테마 훅 사용
  const theme = useSeasonalTheme(currentDate);

  // 인접한 월 데이터 prefetch - readOnly가 아닐 때만
  useReadingLogPrefetch(currentDate.getFullYear(), currentDate.getMonth() + 1, !readOnly);

  // API 호출 - 달력 및 리스트 모드일 때 (월별)
  const {
    data: fetchedMonthlyLogs = [],
    isLoading: isMonthlyLoading,
    isFetching: isMonthlyFetching,
  } = useReadingLogsQuery(currentDate.getFullYear(), currentDate.getMonth() + 1, {
    enabled: (viewMode === "calendar" || viewMode === "list") && !readOnly,
  });

  // API 호출 - 카드 덱 모드일 때 (연간)
  const {
    data: fetchedYearlyLogs = [],
    isLoading: isYearlyLoading,
    isFetching: isYearlyFetching,
  } = useReadingLogsQuery(currentDate.getFullYear(), undefined, {
    enabled: viewMode === "deck" && !readOnly,
  });

  // viewMode에 따른 데이터 분기
  const logs = readOnly
    ? viewMode === "deck"
      ? initialLogs.filter((log) => new Date(log.date).getFullYear() === currentDate.getFullYear())
      : initialLogs
    : viewMode === "deck"
      ? fetchedYearlyLogs
      : fetchedMonthlyLogs;

  const isLoading = readOnly
    ? false
    : viewMode === "deck"
      ? isYearlyLoading
      : isMonthlyLoading;

  const isFetching = readOnly
    ? false
    : viewMode === "deck"
      ? isYearlyFetching
      : isMonthlyFetching;

  const handlePrevMonth = () => onDateChange(subMonths(currentDate, 1));
  const handleNextMonth = () => onDateChange(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const weekDayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const getLogsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return logs.filter((log) => log.date === dateStr);
  };

  return (
    <div className="w-full mx-auto space-y-6">
      {!readOnly && <ReadingLogStats currentDate={currentDate} theme={theme} />}

      <ReadingLogControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={onDateChange}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isLoading={readOnly ? false : isFetching}
        readOnly={readOnly}
      />

      {viewMode === "list" && !readOnly ? (
        <ReadingLogListView />
      ) : viewMode === "deck" ? (
        <ReadingLogCardDeck logs={logs} currentDate={currentDate} readOnly={readOnly} isLoading={isLoading} />
      ) : isLoading ? (
        <ReadingLogCalendarSkeleton />
      ) : (
        <div
          className={cn(
            "bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-stone-200/50 border border-white/60 overflow-hidden ring-1 transition-all duration-500",
            theme.ring, // ring-color
          )}
        >
          {/* 요일 헤더 - 그라데이션 배경 (Dynamic Theme) */}
          <div
            className={cn(
              "grid grid-cols-7 border-b border-stone-100/50 transition-all duration-500 bg-linear-to-r",
              theme.gradient,
            )}
          >
            {weekDayKeys.map((dayKey, i) => (
              <div
                key={dayKey}
                className={cn(
                  "py-4 text-center text-sm font-semibold tracking-wide transition-colors duration-500",
                  i === 0
                    ? theme.primary // 일요일 (Primary Color)
                    : i === 6
                      ? theme.activeText // 토요일 (Active/Dark Color)
                      : theme.accent, // 평일 (Accent/Gray Color)
                )}
              >
                {t(`weekdays.${dayKey}`)}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 auto-rows-[100px] sm:auto-rows-[160px] divide-x divide-y divide-gray-100">
            {calendarDays.map((day) => (
              <ReadingLogDayCell
                key={day.toISOString()}
                date={day}
                logs={getLogsForDate(day)}
                isCurrentMonth={isSameMonth(day, monthStart)}
                onClick={() => handleDayClick(day)}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}

      <DayDetailsDialog
        date={selectedDate}
        logs={selectedDate ? getLogsForDate(selectedDate) : []}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        readOnly={readOnly}
      />
    </div>
  );
}
