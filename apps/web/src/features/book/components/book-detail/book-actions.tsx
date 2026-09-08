"use client";

import { useBookStatsQuery } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";

import { WishlistButton } from "@/features/user/components/wishlist/wishlist-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";

interface BookActionsProps {
  isbn: string;
}

export const BookActions = ({ isbn }: BookActionsProps) => {
  const t = useTranslations("book.detail");
  const { data: stats, isLoading } = useBookStatsQuery(isbn);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 flex-wrap">
        <WishlistButton
          type="BOOK"
          id={isbn}
          className="w-full sm:w-auto border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8 rounded-md shrink-0"
        />

        {/* 데스크톱용 구분 세로선 */}
        <div className="hidden sm:block h-6 w-px bg-stone-200" />

        {/* 에디토리얼 타이포그래피 통계 데이터 */}
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[0.15em] text-stone-400 font-medium select-none">
          {isLoading ? (
            // 로딩 상태: 깔끔한 미니 스켈레톤
            <>
              <div className="h-4 w-16 bg-stone-100 animate-pulse rounded" />
              <div className="w-1 h-1 rounded-full bg-stone-200" />
              <div className="h-4 w-16 bg-stone-100 animate-pulse rounded" />
            </>
          ) : (
            <>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="cursor-help hover:text-stone-600 transition-colors py-1">
                    <span className="text-stone-900 font-semibold text-xs mr-1">
                      {stats?.readingUserCount ?? 0}
                    </span>
                    {t("stats.readers")}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-stone-900 text-stone-50 border-stone-800 text-xs">
                  <p>
                    {t("stats.readers_tooltip", {
                      count: stats?.readingUserCount ?? 0,
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>

              <div className="w-1 h-1 rounded-full bg-stone-200 shrink-0" />

              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="cursor-help hover:text-stone-600 transition-colors py-1">
                    <span className="text-stone-900 font-semibold text-xs mr-1">
                      {stats?.wishlistUserCount ?? 0}
                    </span>
                    {t("stats.wishlisted")}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-stone-900 text-stone-50 border-stone-800 text-xs">
                  <p>
                    {t("stats.wishlist_tooltip", {
                      count: stats?.wishlistUserCount ?? 0,
                    })}
                  </p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
