"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { useMyStatsQuery } from "@/features/user/queries";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export const UserStatsDashboard = () => {
  const t = useTranslations("my_page.stats");
  const { data: stats, isLoading } = useMyStatsQuery();
  const toggleChat = useChatStore((state) => state.toggleChat);

  if (isLoading) {
    return <UserStatsDashboardSkeleton />;
  }

  const forSale = stats?.salesStatusCounts?.FOR_SALE ?? 0;
  const reserved = stats?.salesStatusCounts?.RESERVED ?? 0;
  const sold = stats?.salesStatusCounts?.SOLD ?? 0;
  const chats = stats?.chatRoomCount ?? 0;
  const reviews = stats?.reviewsCount ?? 0;

  return (
    <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 서평 기록 현황 (5 cols) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 p-6 text-white shadow-xs transition-shadow duration-300 hover:shadow-md lg:col-span-5">
        <div>
          <div className="flex items-center justify-between border-b border-stone-800/80 pb-3.5">
            <h2 className="text-base font-semibold tracking-tight text-stone-100 sm:text-lg">
              {t("my_reviews_title")}
            </h2>
            <Link
              href={PATHS.MY_REVIEWS}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors hover:text-white"
            >
              <span>{t("view_all")}</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="mt-6 flex items-baseline gap-1.5">
            <span className="font-serif text-4xl font-bold tracking-tight text-white transition-transform duration-300 group-hover:scale-102 sm:text-5xl">
              {reviews}
            </span>
            <span className="text-sm font-medium text-stone-400">
              {t("unit_count")}
            </span>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2.5 border-t border-stone-800/80 pt-4">
          <Link
            href={PATHS.READING_LOG}
            className="flex-1 rounded-xl bg-stone-800/90 py-2.5 text-center text-xs font-medium text-stone-200 transition-all hover:bg-stone-700 hover:text-white active:scale-98"
          >
            {t("btn_reading_log")}
          </Link>
          <Link
            href={PATHS.MY_REVIEWS}
            className="flex-1 rounded-xl bg-stone-800/40 py-2.5 text-center text-xs font-medium text-stone-300 transition-all hover:bg-stone-700 hover:text-white active:scale-98"
          >
            {t("btn_manage_reviews")}
          </Link>
        </div>
      </div>

      {/* 중고 책방 거래 현황 (7 cols) */}
      <div className="group flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs transition-shadow duration-300 hover:shadow-md lg:col-span-7">
        <div>
          <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
            <h2 className="text-base font-semibold tracking-tight text-stone-900 sm:text-lg">
              {t("market_title")}
            </h2>
            <Link
              href={PATHS.MY_PAGE_SALES}
              className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 transition-colors hover:text-stone-900"
            >
              <span>{t("my_sales")}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-stone-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* 판매중 */}
            <Link
              href={PATHS.MY_PAGE_SALES}
              className="group flex flex-col justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3.5 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-98"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t("for_sale")}
              </span>
              <span className="mt-2.5 font-serif text-2xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-stone-950">
                {forSale}
              </span>
            </Link>

            {/* 예약중 */}
            <Link
              href={PATHS.MY_PAGE_SALES}
              className="group flex flex-col justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3.5 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-98"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {t("reserved")}
              </span>
              <span className="mt-2.5 font-serif text-2xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-stone-950">
                {reserved}
              </span>
            </Link>

            {/* 판매완료 */}
            <Link
              href={PATHS.MY_PAGE_SALES}
              className="group flex flex-col justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3.5 transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-98"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                {t("sold")}
              </span>
              <span className="mt-2.5 font-serif text-2xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-stone-950">
                {sold}
              </span>
            </Link>

            {/* 진행중인 대화 */}
            <button
              type="button"
              onClick={toggleChat}
              className="group flex flex-col justify-between rounded-xl border border-stone-100 bg-stone-50/60 p-3.5 text-left transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-98"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-stone-600">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {t("chats")}
              </span>
              <span className="mt-2.5 font-serif text-2xl font-bold tracking-tight text-stone-900 transition-colors group-hover:text-stone-950">
                {chats}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-stone-100 pt-3">
          <Link
            href={PATHS.BOOK_SALES_REGISTER}
            className="text-xs font-medium text-stone-700 transition-colors hover:text-stone-950 hover:underline hover:underline-offset-4"
          >
            {t("register_sale")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export const UserStatsDashboardSkeleton = () => (
  <div className="mb-10 grid grid-cols-1 gap-4 lg:grid-cols-12">
    <div className="h-56 rounded-2xl bg-stone-900 p-6 lg:col-span-5">
      <Skeleton className="h-4 w-20 bg-stone-800" />
      <Skeleton className="mt-5 h-10 w-16 bg-stone-800" />
      <div className="mt-10 flex gap-2.5">
        <Skeleton className="h-9 flex-1 bg-stone-800" />
        <Skeleton className="h-9 flex-1 bg-stone-800" />
      </div>
    </div>
    <div className="h-56 rounded-2xl border border-stone-200/80 bg-white p-6 lg:col-span-7">
      <Skeleton className="h-4 w-20 bg-stone-100" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl bg-stone-50" />
        ))}
      </div>
    </div>
  </div>
);
