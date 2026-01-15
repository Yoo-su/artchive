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

import { useReadingLogPrefetch } from "../../hooks/use-reading-log-prefetch";
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

export function ReadingLogCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ReadingLogViewMode>("calendar");

  // 인접한 월 데이터 prefetch
  useReadingLogPrefetch(currentDate.getFullYear(), currentDate.getMonth() + 1);

  // API 호출 (달력 모드일 때만)
  const { data: logs = [], isFetching } = useReadingLogsQuery(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    { enabled: viewMode === "calendar" }
  );

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

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
      <ReadingLogStats currentDate={currentDate} />

      <ReadingLogControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        isLoading={isFetching}
      />

      {viewMode === "list" ? (
        <ReadingLogListView />
      ) : isFetching ? (
        <ReadingLogCalendarSkeleton />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
            {weekDayNames.map((day, i) => (
              <div
                key={day}
                className={`py-3 text-center text-sm font-semibold ${
                  i === 0
                    ? "text-rose-500"
                    : i === 6
                      ? "text-blue-500"
                      : "text-gray-500"
                }`}
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
