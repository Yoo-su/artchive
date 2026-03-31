import { createQueryKeys } from "@lukemorales/query-key-factory";

export const notificationKeys = createQueryKeys("notification", {
  list: (cursor?: number) => ({
    queryKey: [cursor],
  }),
  unreadCount: null,
});
