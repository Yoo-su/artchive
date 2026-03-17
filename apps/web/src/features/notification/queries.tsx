import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { CACHE_TIME } from "@/shared/constants/cache";

import { getNotifications, getUnreadCount } from "./apis";
import { notificationKeys } from "./constants/query-keys";

export const useNotifications = () => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list.queryKey,
    queryFn: ({ pageParam }) => getNotifications({ cursor: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount.queryKey,
    queryFn: getUnreadCount,
    staleTime: CACHE_TIME.INFINITY,
  });
};
