"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/shadcn/button";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

export function ReadingLogCalendarSkeleton() {
  const weekDayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Button variant="outline" size="icon" disabled className="opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" disabled className="opacity-50">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
          {weekDayNames.map((day, i) => (
            <div
              key={day}
              className={`py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold ${
                i === 0
                  ? "text-rose-500/50"
                  : i === 6
                    ? "text-blue-500/50"
                    : "text-gray-500/50"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 그리드 스켈레톤 - 모바일과 데스크탑 반응형 */}
        <div className="grid grid-cols-7 auto-rows-[80px] sm:auto-rows-[160px] divide-x divide-y divide-gray-100">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="p-1 sm:p-2 flex flex-col gap-1 sm:gap-2 h-full"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full" />
              </div>
              {/* 모바일: 중앙 뱃지만, 데스크탑: 책 목록 */}
              <div className="flex-1 flex items-center justify-center sm:hidden">
                <Skeleton className="h-4 w-8 rounded-full" />
              </div>
              <div className="hidden sm:flex flex-1 flex-col gap-1">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
