import { readingLogKeys } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { addMonths, isAfter, startOfMonth, subMonths } from "date-fns";
import { useEffect } from "react";

import { CACHE_TIME } from "@/shared/constants/cache";

import { getReadingLogs, getReadingLogStats } from "../apis";

export const useReadingLogPrefetch = (year: number, month: number, enabled = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const currentDate = new Date(year, month - 1);
    const prevDate = subMonths(currentDate, 1);
    const nextDate = addMonths(currentDate, 1);

    const targetDates = [prevDate];

    // nextDate가 현재 달(오늘)을 초과하는 '미래 달'이 아닐 경우에만 prefetch에 포함
    if (!isAfter(startOfMonth(nextDate), startOfMonth(new Date()))) {
      targetDates.push(nextDate);
    }

    targetDates.forEach((date) => {
      const targetYear = date.getFullYear();
      const targetMonth = date.getMonth() + 1;

      queryClient.prefetchQuery({
        queryKey: readingLogKeys.list(targetYear, targetMonth).queryKey,
        queryFn: () => getReadingLogs(targetYear, targetMonth),
        staleTime: CACHE_TIME.FIVE_MINUTES,
      });

      queryClient.prefetchQuery({
        queryKey: readingLogKeys.stats(targetYear, targetMonth).queryKey,
        queryFn: () => getReadingLogStats(targetYear, targetMonth),
        staleTime: CACHE_TIME.FIVE_MINUTES,
      });
    });
  }, [year, month, queryClient]);
};
