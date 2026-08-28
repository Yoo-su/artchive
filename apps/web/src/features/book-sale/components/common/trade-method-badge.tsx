"use client";

import { TradeMethod } from "@bookjeok/core";
import { Handshake } from "lucide-react";
import { useTranslations } from "next-intl";

import { BoxIcon, TruckFastIcon } from "@/shared/components/icons";
import { Badge } from "@/shared/components/shadcn/badge";
import { cn } from "@/shared/utils/cn";

interface TradeMethodBadgeProps {
  tradeMethod?: TradeMethod;
  className?: string;
  showIcon?: boolean;
}

export const TradeMethodBadge = ({
  tradeMethod = TradeMethod.DIRECT_ONLY,
  className,
  showIcon = true,
}: TradeMethodBadgeProps) => {
  const t = useTranslations("market.trade_method");

  const getConfig = () => {
    switch (tradeMethod) {
      case TradeMethod.DELIVERY_ONLY:
        return {
          icon: <TruckFastIcon className="w-3.5 h-3.5 mr-1" />,
          label: t("DELIVERY_ONLY"),
          className:
            "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700",
        };
      case TradeMethod.BOTH:
        return {
          icon: <BoxIcon className="w-3.5 h-3.5 mr-1" />,
          label: t("BOTH"),
          className:
            "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700",
        };
      case TradeMethod.DIRECT_ONLY:
      default:
        return {
          icon: <Handshake className="w-3 h-3 mr-1" />,
          label: t("DIRECT_ONLY"),
          className:
            "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700",
        };
    }
  };

  const config = getConfig();

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium px-2 py-0.5 inline-flex items-center",
        config.className,
        className,
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
};
