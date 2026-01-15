"use client";

import { format } from "date-fns";
import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { cn } from "@/shared/utils";

import { READING_LOG_COLORS } from "../../constants";
import { ReadingLog } from "../../types";

interface ReadingLogDayCellProps {
  date: Date;
  logs: ReadingLog[];
  isCurrentMonth: boolean;
  onClick: () => void;
}

export function ReadingLogDayCell({
  date,
  logs,
  isCurrentMonth,
  onClick,
}: ReadingLogDayCellProps) {
  const isToday =
    format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-1 h-full flex flex-col transition-colors cursor-pointer group hover:bg-[#ebf2e8]/50", // 말차 틴트 배경색 (호버 시)
        !isCurrentMonth && "bg-gray-50/50 text-gray-300 pointer-events-none"
      )}
    >
      <div className="flex justify-between items-start mb-1 px-1">
        <span
          className={cn(
            "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-all",
            isToday
              ? "text-white shadow-md"
              : "text-gray-700 group-hover:text-[#4b6043]" // 그룹 호버 텍스트 색상
          )}
          style={{
            backgroundColor: isToday
              ? READING_LOG_COLORS.matcha.medium
              : "transparent",
            boxShadow: isToday
              ? `0 2px 4px ${READING_LOG_COLORS.matcha.light}66`
              : "none",
          }}
        >
          {format(date, "d")}
        </span>

        {/* 데스크탑에서만 보이는 권수 뱃지 */}
        {logs.length > 0 && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border hidden sm:inline-block"
            style={{
              color: READING_LOG_COLORS.matcha.dark,
              backgroundColor: READING_LOG_COLORS.matcha.bg,
              borderColor: READING_LOG_COLORS.matcha.light + "40",
            }}
          >
            {logs.length}권
          </span>
        )}
      </div>

      {/* 모바일 뷰: 책이 있으면 중앙에 숫자 뱃지만 표시 */}
      <div className="sm:hidden flex-1 flex items-center justify-center">
        {logs.length > 0 && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border bg-white"
            style={{
              color: READING_LOG_COLORS.matcha.dark,
              backgroundColor: READING_LOG_COLORS.matcha.bg,
              borderColor: READING_LOG_COLORS.matcha.light + "40",
            }}
          >
            {logs.length}권
          </span>
        )}
      </div>

      {/* 데스크탑 뷰: 책 목록 표시 */}
      <div className="hidden sm:flex flex-1 flex-col gap-1 overflow-hidden px-1">
        {logs.slice(0, 2).map((log) => (
          <TooltipProvider key={log.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-md border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-[#7a9968]/50">
                  <div className="relative w-6 h-9 shrink-0 rounded overflow-hidden shadow-sm">
                    <Image
                      src={log.bookImage}
                      alt={log.bookTitle}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-gray-700 truncate w-full hidden sm:block">
                    {log.bookTitle}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-[200px] bg-gray-800 text-white border-0 shadow-xl z-50 p-3"
              >
                <p className="font-semibold text-xs mb-1 line-clamp-1">
                  {log.bookTitle}
                </p>
                <p className="text-[10px] opacity-80 mb-2 line-clamp-1 text-gray-300">
                  {log.bookAuthor}
                </p>
                {log.memo && (
                  <p className="text-[10px] pt-2 border-t border-white/10 text-yellow-100/90 whitespace-normal wrap-break-word leading-relaxed">
                    "{log.memo}"
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {logs.length > 2 && (
          <div
            className="text-[10px] pl-1"
            style={{ color: READING_LOG_COLORS.gray.subText }}
          >
            + {logs.length - 2}권 더보기
          </div>
        )}
      </div>
    </div>
  );
}
