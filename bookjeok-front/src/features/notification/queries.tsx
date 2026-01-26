import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { getNotifications, getUnreadCount } from "./api";
import { notificationKeys } from "./constants/query-keys";

export const useNotifications = () => {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(),
    queryFn: ({ pageParam }) => getNotifications({ cursor: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: Infinity,
  });
};
