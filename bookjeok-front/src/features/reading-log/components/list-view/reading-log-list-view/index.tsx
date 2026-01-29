"use client";

import { format, parseISO } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { cn } from "@/shared/utils";

import { getSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import { useReadingLogsInfiniteQuery } from "../../../queries";
import { DayDetailsDialog } from "../../common/day-details-dialog";

export function ReadingLogListView() {
  const t = useTranslations("reading_log.list");
  const locale = useLocale();
  const dateLocale = locale === "ko" ? ko : enUS;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useReadingLogsInfiniteQuery();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    // 스켈레톤에도 테마 적용하면 좋겠지만 일단 유지
    return <ReadingLogListSkeleton />;
  }

  if (status === "error") {
    return <div className="text-center py-8 text-red-500">{t("error")}</div>;
  }

  const allLogs = data?.pages.flatMap((page) => page.items) || [];

  if (allLogs.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 bg-stone-50 rounded-xl">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allLogs.map((log, index) => {
        const currentDate = parseISO(log.date);
        const prevDate = index > 0 ? parseISO(allLogs[index - 1].date) : null;

        // 아이템별 동적 테마 적용
        const theme = getSeasonalTheme(currentDate);

        const showHeader =
          !prevDate ||
          format(currentDate, "yyyy-MM") !== format(prevDate, "yyyy-MM");

        return (
          <Fragment key={log.id}>
            {showHeader && (
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-3 border-b border-stone-100 mb-4 transition-all">
                <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shadow-sm",
                      theme.todayBg,
                    )}
                  />
                  {/* 헤더도 해당 월의 테마를 따라감 */}
                  {format(currentDate, t("header_date_format"), {
                    locale: dateLocale,
                  })}
                </h3>
              </div>
            )}
            <div
              className={cn(
                "flex gap-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm transition-all group",
                "hover:shadow-md hover:-translate-y-0.5",
                // 동적 테두리 색상 (hover)
                `hover:${theme.border}`,
              )}
            >
              <div className="relative w-24 h-32 shrink-0 rounded-lg overflow-hidden bg-stone-100 shadow-md ring-1 ring-black/5">
                <Image
                  src={log.bookImage}
                  alt={log.bookTitle}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="100px"
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-stone-900 line-clamp-1 mb-1 text-lg font-serif tracking-tight">
                      {log.bookTitle}
                    </h4>
                    <p className="text-sm text-stone-500 line-clamp-1 mb-3 font-medium">
                      {log.bookAuthor}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap",
                      theme.bg,
                      theme.primary,
                      theme.border,
                    )}
                  >
                    {format(currentDate, t("item_date_format"), {
                      locale: dateLocale,
                    })}
                  </span>
                </div>
                {log.memo && (
                  <div
                    className={cn(
                      "p-3.5 rounded-xl text-sm mt-1 whitespace-pre-wrap leading-relaxed font-medium",
                      theme.bg,
                      theme.activeText,
                    )}
                  >
                    {log.memo}
                  </div>
                )}
              </div>
            </div>
          </Fragment>
        );
      })}

      {/* 무한 스크롤 트리거 */}
      <div ref={ref} className="h-4 w-full">
        {isFetchingNextPage && (
          <div className="py-4 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}

function ReadingLogListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-stone-200 rounded animate-pulse mb-4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 bg-white rounded-2xl border border-stone-100"
        >
          <Skeleton className="w-24 h-32 shrink-0 rounded-lg bg-stone-100" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-6 w-3/4 bg-stone-100" />
            <Skeleton className="h-4 w-1/2 bg-stone-50" />
            <Skeleton className="h-16 w-full rounded-xl mt-3 bg-stone-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
