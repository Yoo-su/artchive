"use client";

import { setMonth, setYear } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List as ListIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { cn } from "@/shared/utils";

export type ReadingLogViewMode = "calendar" | "list";

interface ReadingLogControlsProps {
  viewMode: ReadingLogViewMode;
  onViewModeChange: (mode: ReadingLogViewMode) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  isLoading?: boolean;
}

export function ReadingLogControls({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  onPrevMonth,
  onNextMonth,
  isLoading,
}: ReadingLogControlsProps) {
  const t = useTranslations("reading_log.controls");
  const tCalendar = useTranslations("reading_log.calendar");
  // 연도 선택 옵션 생성 (현재 연도 + 1 년 동안 2020년까지)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2020 + 2 },
    (_, i) => currentYear + 1 - i,
  );
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearChange = (yearStr: string) => {
    onDateChange(setYear(currentDate, parseInt(yearStr)));
  };

  const handleMonthChange = (monthStr: string) => {
    onDateChange(setMonth(currentDate, parseInt(monthStr) - 1));
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      {/* 왼쪽: 네비게이션 (달력 모드에서만 표시) */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        {viewMode === "calendar" ? (
          <>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={onPrevMonth}
                disabled={isLoading}
                className="h-8 w-8 hover:bg-teal-50 hover:text-teal-600 border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-1 mx-1">
                <Select
                  value={currentDate.getFullYear().toString()}
                  onValueChange={handleYearChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 w-[100px] border-none shadow-none focus:ring-0 font-bold text-lg px-1 bg-transparent hover:bg-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                        {tCalendar("year_suffix")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={(currentDate.getMonth() + 1).toString()}
                  onValueChange={handleMonthChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 w-[70px] border-none shadow-none focus:ring-0 font-bold text-lg px-1 bg-transparent hover:bg-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m}
                        {tCalendar("month_suffix")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={onNextMonth}
                disabled={isLoading}
                className="h-8 w-8 hover:bg-teal-50 hover:text-teal-600 border-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <h2 className="text-xl font-bold text-gray-800 ml-1">
            {t("all_logs")}
          </h2>
        )}
      </div>

      {/* 오른쪽: 뷰 모드 토글 */}
      <div className="flex items-center bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => onViewModeChange("calendar")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            viewMode === "calendar"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
          )}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>{t("view_calendar")}</span>
        </button>
        <button
          onClick={() => onViewModeChange("list")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
            viewMode === "list"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50",
          )}
        >
          <ListIcon className="w-4 h-4" />
          <span>{t("view_list")}</span>
        </button>
      </div>
    </div>
  );
}
