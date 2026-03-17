import { useQueryClient } from "@tanstack/react-query";
import { addMonths, subMonths } from "date-fns";
import { useEffect } from "react";

import { CACHE_TIME } from "@/shared/constants/cache";

import { getReadingLogs, getReadingLogStats } from "../apis";
import { readingLogKeys } from "../constants/query-keys";

export const useReadingLogPrefetch = (year: number, month: number) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const currentDate = new Date(year, month - 1);
    const prevDate = subMonths(currentDate, 1);
    const nextDate = addMonths(currentDate, 1);

    const targetDates = [prevDate, nextDate];

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
