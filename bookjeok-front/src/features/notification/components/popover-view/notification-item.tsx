import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { cn } from "@/shared/utils";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useMarkAsRead } from "../../mutations";
import { Notification } from "../../types";
import { getNotificationLink, getNotificationMessage } from "../../utils";

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export const NotificationItem = ({
  notification,
  onClose,
}: NotificationItemProps) => {
  const { mutate: markAsRead } = useMarkAsRead();
  const link = getNotificationLink(notification);
  const message = getNotificationMessage(notification);

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onClose?.();
  };

  return (
    <Link
      href={link}
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3.5 p-4 transition-all duration-200 relative group border-b border-border/40 last:border-0",
        "hover:bg-sky-50/50 dark:hover:bg-sky-900/10",
        !notification.isRead
          ? "bg-sky-50/30 dark:bg-sky-900/5"
          : "bg-transparent",
      )}
    >
      <Avatar className="h-10 w-10 mt-0.5 border border-border/50 shadow-sm shrink-0">
        <AvatarImage
          src={getProfileImageUrl(notification.actor?.profileImageUrl)}
          alt={notification.actor?.nickname}
          className="object-cover"
        />
        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
          {notification.actor?.nickname?.[0] ?? "?"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-none text-foreground">
            {notification.actor?.nickname}
          </p>
          <span className="text-[11px] text-muted-foreground/80 shrink-0 font-medium tracking-tight">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </span>
        </div>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-[13px] leading-relaxed text-muted-foreground line-clamp-2 break-keep cursor-default">
                {message}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="max-w-[280px] text-xs leading-relaxed break-keep bg-zinc-900/95 text-zinc-50 border-none shadow-xl [&_svg]:hidden px-3 py-2 rounded-md backdrop-blur-sm"
              sideOffset={5}
            >
              <p>{message}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {!notification.isRead && (
        <span className="absolute right-3.5 top-4 h-2 w-2 rounded-full bg-orange-500 shadow-sm ring-2 ring-background ring-offset-1 ring-offset-sky-50/30" />
      )}
    </Link>
  );
};
