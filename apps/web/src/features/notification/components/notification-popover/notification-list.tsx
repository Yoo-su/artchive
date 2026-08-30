import { useNotificationsInfiniteQuery } from "@bookjeok/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { NotificationItem } from "./notification-item";

interface NotificationListProps {
  onClose?: () => void;
}

export const NotificationList = ({ onClose }: NotificationListProps) => {
  const t = useTranslations("notification");
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotificationsInfiniteQuery();

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const notifications = data?.pages.flatMap((page) => page.items) ?? [];

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <p className="text-sm">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] sm:h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex flex-col divide-y">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}
        {isFetchingNextPage && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={ref} className="h-1" />
      </div>
    </div>
  );
};
