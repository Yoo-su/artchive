"use client";

import { format } from "date-fns";
import Image from "next/image";

import { cn } from "@/shared/utils";

import { SeasonalTheme } from "../../../constants";
import { ReadingLog } from "../../../types";

interface ReadingLogDayCellProps {
  date: Date;
  logs: ReadingLog[];
  isCurrentMonth: boolean;
  onClick: () => void;
  theme: SeasonalTheme;
}

export function ReadingLogDayCell({
  date,
  logs,
  isCurrentMonth,
  onClick,
  theme,
}: ReadingLogDayCellProps) {
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const hasLogs = logs.length > 0;
  const firstLog = hasLogs ? logs[0] : null;
  const extraCount = Math.max(0, logs.length - 1);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-2 h-full flex flex-col transition-all duration-300 cursor-pointer group hover:z-10",
        // 기본 배경: 투명 -> 호버 시 약간의 테마 색상 (아주 연하게)
        // 기본 배경: 투명 -> 호버 시 약간의 테마 색상 (아주 연하게)
        theme.hoverBg, // hover bg color
        !isCurrentMonth && "opacity-30 pointer-events-none bg-stone-50/50",
        // 오늘 날짜 배경 강조 (선택적)
        isToday && "bg-stone-50/50",
      )}
    >
      {/* 날짜 표시 */}
      <div className="flex justify-between items-start mb-1 h-6 shrink-0">
        <span
          className={cn(
            "text-xs w-6 h-6 flex items-center justify-center rounded-full transition-all duration-300 font-serif z-10",
            isToday
              ? cn(
                  "shadow-md ring-2 ring-offset-1 font-bold scale-110",
                  theme.todayBg,
                  theme.todayText,
                  theme.ring,
                )
              : cn(
                  "text-stone-500 font-medium group-hover:scale-110 group-hover:bg-white group-hover:shadow-sm",
                  `group-hover:${theme.activeText}`,
                ),
          )}
        >
          {format(date, "d")}
        </span>
      </div>

      {/* 통합 View: 책 표지 Hero UI (모바일은 미니 표지, 데스크탑은 표지+제목) */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-0 w-full">
        {hasLogs && firstLog ? (
          <div className="w-full h-full flex flex-col items-center gap-1 sm:gap-2 group/book justify-center">
            {/* 책 표지 이미지 (메인) */}
            <div
              className={cn(
                "relative h-[85%] sm:h-full w-auto aspect-2/3 shadow-md rounded-sm sm:rounded-md overflow-hidden transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-1 ring-1 ring-black/5 bg-stone-100",
                // 테마에 따른 은은한 그림자 색상
                `group-hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_0_0_1px_${theme.border.replace(
                  "border-",
                  "",
                )}]`,
              )}
            >
              <Image
                src={firstLog.bookImage}
                alt={firstLog.bookTitle}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 60px, 120px"
              />

              {/* 여러 권일 경우 뱃지 (이미지 위 오버레이) */}
              {extraCount > 0 && (
                <div
                  className={cn(
                    "absolute bottom-0 right-0 px-1 sm:px-1.5 py-0.5 bg-black/60 backdrop-blur-[2px] text-[9px] sm:text-[10px] font-bold text-white rounded-tl-md rounded-br-sm sm:rounded-br-md z-10",
                  )}
                >
                  +{extraCount}
                </div>
              )}
            </div>

            {/* 책 제목 (데스크탑만 노출) */}
            <p
              className={cn(
                "hidden sm:block text-[10px] sm:text-xs text-center font-medium leading-tight text-stone-600 truncate px-1 w-full transition-colors group-hover:text-stone-900",
              )}
            >
              {firstLog.bookTitle}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
