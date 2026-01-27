import { useState } from "react";

import { Button } from "@/shared/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";

import { useMarkAllAsRead } from "../../mutations";
import { NotificationBell } from "../widgets/notification-bell";
import { NotificationList } from "./notification-list";

export const NotificationPopover = () => {
  const [open, setOpen] = useState(false);
  const { mutate: markAllAsRead } = useMarkAllAsRead();

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleReadAll = () => {
    markAllAsRead();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={true}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <NotificationBell />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[90vw] max-w-[360px] p-0 shadow-2xl border border-border/60 rounded-2xl overflow-hidden bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80"
        align="center"
        sideOffset={12}
        collisionPadding={10}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-[15px] text-foreground tracking-tight">
              알림
            </h4>
            <div className="h-1 w-1 rounded-full bg-orange-500" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
            onClick={handleReadAll}
          >
            모두 읽음
          </Button>
        </div>
        <NotificationList onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};
