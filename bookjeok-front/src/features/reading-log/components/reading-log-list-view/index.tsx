"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { READING_LOG_COLORS } from "../../constants";
import { useReadingLogsInfiniteQuery } from "../../queries";
import { DayDetailsDialog } from "../day-details-dialog";

export function ReadingLogListView() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useReadingLogsInfiniteQuery();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return <ReadingLogListSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="text-center py-8 text-red-500">
        데이터를 불러오는데 실패했습니다.
      </div>
    );
  }

  const allLogs = data?.pages.flatMap((page) => page.items) || [];

  if (allLogs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
        아직 기록된 독서 활동이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allLogs.map((log, index) => {
        const currentDate = parseISO(log.date);
        const prevDate = index > 0 ? parseISO(allLogs[index - 1].date) : null;

        const showHeader =
          !prevDate ||
          format(currentDate, "yyyy-MM") !== format(prevDate, "yyyy-MM");

        return (
          <Fragment key={log.id}>
            {showHeader && (
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2 border-b border-gray-100 mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  {format(currentDate, "yyyy년 M월", { locale: ko })}
                </h3>
              </div>
            )}
            <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-20 h-28 shrink-0 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={log.bookImage}
                  alt={log.bookTitle}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 line-clamp-1 mb-1">
                      {log.bookTitle}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">
                      {log.bookAuthor}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-stone-100 text-stone-600">
                    {format(currentDate, "d일 (iii)", { locale: ko })}
                  </span>
                </div>
                {log.memo && (
                  <div
                    className="p-3 rounded-lg text-sm mt-1 whitespace-pre-wrap leading-relaxed"
                    style={{
                      backgroundColor: READING_LOG_COLORS.matcha.bg,
                      color: READING_LOG_COLORS.matcha.dark,
                    }}
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
      <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100"
        >
          <Skeleton className="w-20 h-28 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-16 w-full rounded-lg mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
