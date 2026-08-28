"use client";

import { useSellerStatsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import React from "react";

import { ShieldSecurityIcon } from "@/shared/components/icons";
import { cn } from "@/shared/utils/cn";

interface SellerTrustBadgeProps {
  handle: string;
  size?: "sm" | "md";
  className?: string;
}

export const SellerTrustBadge = ({
  handle,
  size = "md",
  className,
}: SellerTrustBadgeProps) => {
  const t = useTranslations("order.trade_review.stats");
  const { data: stats, isLoading } = useSellerStatsQuery(handle, {
    enabled: !!handle,
  });

  if (isLoading || !stats) {
    return null;
  }

  if (stats.totalCompletedSales === 0 && stats.totalReviews === 0) {
    return null;
  }

  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium",
        isSmall ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className,
      )}
    >
      <ShieldSecurityIcon
        className={cn(
          "text-emerald-600 dark:text-emerald-400 shrink-0",
          isSmall ? "h-3 w-3" : "h-3.5 w-3.5",
        )}
      />
      <span>
        {t("badge_trust", {
          count: stats.totalCompletedSales,
          rate: stats.positiveRate,
        })}
      </span>
    </div>
  );
};
