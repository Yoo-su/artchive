"use client";

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
import { useState } from "react";

import { cn } from "@/shared/utils";

import { useReadingLogPrefetch } from "../../hooks/use-reading-log-prefetch";
import { useSeasonalTheme } from "../../hooks/use-seasonal-theme";
import { useReadingLogsQuery } from "../../queries";
import { DayDetailsDialog } from "../day-details-dialog";
import { ReadingLogCalendarSkeleton } from "../reading-log-calendar-skeleton";
import {
  ReadingLogControls,
  ReadingLogViewMode,
} from "../reading-log-controls";
import { ReadingLogDayCell } from "../reading-log-day-cell";
import { ReadingLogListView } from "../reading-log-list-view";
import { ReadingLogStats } from "../reading-log-stats";

interface ReadingLogCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function ReadingLogCalendar({
  currentDate,
  onDateChange,
}: ReadingLogCalendarProps) {
  // 내부 상태는 선택된 날짜와 다이얼로그, 뷰 모드만 관리
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ReadingLogViewMode>("calendar");

  // 계절 테마 훅 사용
  const theme = useSeasonalTheme(currentDate);

  // 인접한 월 데이터 prefetch
  useReadingLogPrefetch(currentDate.getFullYear(), currentDate.getMonth() + 1);

  // API 호출 (달력 모드일 때만)
  const { data: logs = [], isFetching } = useReadingLogsQuery(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    { enabled: viewMode === "calendar" },
  );

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

  const weekDayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const getLogsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return logs.filter((log) => log.date === dateStr);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <ReadingLogStats currentDate={currentDate} theme={theme} />

      <ReadingLogControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={onDateChange}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isLoading={isFetching}
      />

      {viewMode === "list" ? (
        <ReadingLogListView theme={theme} />
      ) : isFetching ? (
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
            {weekDayNames.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "py-4 text-center text-sm font-semibold tracking-wide transition-colors duration-500",
                  i === 0
                    ? theme.primary // 일요일 (Primary Color)
                    : i === 6
                      ? theme.activeText // 토요일 (Active/Dark Color)
                      : theme.accent, // 평일 (Accent/Gray Color)
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div className="grid grid-cols-7 auto-rows-[160px] divide-x divide-y divide-gray-100">
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
      />
    </div>
  );
}
