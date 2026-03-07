import { createQueryKeys } from "@lukemorales/query-key-factory";

export const notificationKeys = createQueryKeys("notification", {
  list: null,
  unreadCount: null,
});
