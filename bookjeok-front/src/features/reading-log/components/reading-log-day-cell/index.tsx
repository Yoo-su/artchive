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

import { READING_LOG_COLORS, SeasonalTheme } from "../../constants";
import { ReadingLog } from "../../types";

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

  // 책 개수에 따른 배경 강도 결정 (Dynamic Theme)
  const getBookCountBackground = () => {
    if (logs.length === 0) return "";
    // 예: "bg-rose-50/60"
    if (logs.length === 1)
      return `${theme.bg.split("-")[0]}-${theme.bg.split("-")[1]}-50/60`;
    if (logs.length <= 3)
      return `${theme.bg.split("-")[0]}-${theme.bg.split("-")[1]}-100/50`;
    // Gradient는 theme.gradient 사용
    return `bg-gradient-to-br ${theme.gradient}`;
  };

  // Tailwind class 문자열 조작 대신, 안전하게 theme 속성을 활용
  // gradient의 경우 from/via/to가 이미 포함되어 있으므로 bg-gradient-to-br만 붙이면 됨

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-1 h-full flex flex-col transition-all duration-300 cursor-pointer group",
        // 호버 배경색 동적 적용
        theme.hoverBg,
        "hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]",
        // 배경색 적용 로직 단순화 (gradient 직접 사용)
        logs.length >= 4 ? `bg-linear-to-br ${theme.gradient}` : "",
        logs.length > 0 && logs.length < 4 ? theme.bg : "", // 단순 배경색
        !isCurrentMonth && "bg-stone-50/30 text-stone-300 pointer-events-none",
      )}
    >
      <div className="flex justify-between items-start mb-1 px-1">
        <span
          className={cn(
            "text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 font-serif",
            isToday
              ? cn(
                  "shadow-lg animate-pulse ring-2 ring-offset-2 ring-offset-white font-bold",
                  theme.todayBg,
                  theme.todayText,
                  theme.ring,
                )
              : cn(
                  "text-stone-600 group-hover:scale-110 group-hover:bg-white/80 group-hover:shadow-sm",
                  `group-hover:${theme.activeText}`, // Hover Text Color
                ),
          )}
        >
          {format(date, "d")}
        </span>

        {/* 데스크탑에서만 보이는 권수 뱃지 */}
        {logs.length > 0 && (
          <span
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full border hidden sm:inline-block shadow-sm transition-colors duration-300",
              theme.border,
              theme.bg,
            )}
            style={{
              color: READING_LOG_COLORS.cozy.dark, // 텍스트는 가독성 위해 그대로 유지하거나 theme.activeText 사용
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
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full border bg-white shadow-sm",
              theme.border,
            )}
            style={{
              color: READING_LOG_COLORS.cozy.dark,
            }}
          >
            {logs.length}권
          </span>
        )}
      </div>

      {/* 데스크탑 뷰: 책 목록 표시 */}
      <div className="hidden sm:flex flex-1 flex-col gap-1 px-1 overflow-visible">
        {logs.slice(0, 2).map((log) => (
          <TooltipProvider key={log.id}>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "group/card relative flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-stone-100 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:z-20",
                    // 호버 시 테두리 색상 동적 적용 (hover:border-amber-300 같은 형태 필요)
                    `hover:${theme.border.replace("100", "300")}`,
                    `hover:${theme.bg}`,
                  )}
                >
                  <div
                    className={cn(
                      "relative w-6 h-9 shrink-0 rounded overflow-hidden shadow-sm border border-stone-100 transition-colors",
                      `group-hover/card:${theme.border.replace("100", "200")}`,
                    )}
                  >
                    <Image
                      src={log.bookImage}
                      alt={log.bookTitle}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium text-stone-600 truncate w-full hidden sm:block group-hover/card:text-stone-900 transition-colors">
                    {log.bookTitle}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-[200px] bg-stone-800 text-stone-50 border-stone-700 shadow-xl z-50 p-3"
              >
                <p
                  className={cn(
                    "font-semibold text-xs mb-1 line-clamp-1",
                    // 툴팁 내 강조 텍스트 색상을 테마에 맞춤 (아주 연한 색)
                    theme.bg.replace("50", "100"), // 예: text-amber-100 처럼 보이게.. 하지만 bg 클래스이므로 text로 바꿔야함. 일단 하드코딩된 amber-50 유지 혹은 text-white 사용
                  )}
                >
                  {log.bookTitle}
                </p>
                <p className="text-[10px] opacity-80 mb-2 line-clamp-1 text-stone-300">
                  {log.bookAuthor}
                </p>
                {log.memo && (
                  <p className="text-[10px] pt-2 border-t border-white/10 text-amber-100/90 whitespace-normal break-keep leading-relaxed">
                    "{log.memo}"
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {logs.length > 2 && (
          <div
            className="text-[10px] pl-1 pt-0.5 font-medium"
            style={{ color: READING_LOG_COLORS.gray.subText }}
          >
            + {logs.length - 2}권 더보기
          </div>
        )}
      </div>
    </div>
  );
}
