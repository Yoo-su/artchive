"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Library } from "lucide-react";
import { useTranslations } from "next-intl";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { cn } from "@/shared/utils";

import { SeasonalTheme } from "../../../constants";
import { useReadingLogStatsQuery } from "../../../queries";

interface ReadingLogStatsProps {
  currentDate: Date;
  theme: SeasonalTheme;
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <div className="relative inline-flex h-[1.1em] overflow-hidden items-center justify-center min-w-[0.7em]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "60%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-60%", opacity: 0, filter: "blur(4px)" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {/* 공간 확보용 투명 텍스트 */}
      <span className="invisible">{value}</span>
    </div>
  );
}

export function ReadingLogStats({ currentDate, theme }: ReadingLogStatsProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: stats, isLoading } = useReadingLogStatsQuery(year, month);
  const t = useTranslations("reading_log.stats");

  const getMessage = (monthly: number) => {
    if (monthly === 0) return t("messages.start");
    if (monthly >= 5) return t("messages.great");
    if (monthly >= 3) return t("messages.good");
    return t("messages.default");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Skeleton className="h-28 rounded-3xl bg-stone-100" />
        <Skeleton className="h-28 rounded-3xl bg-stone-100" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* 이번 달 카드 - Theme Color 적용 */}
      <div
        className={cn(
          "group p-5 rounded-3xl flex items-center justify-between border backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-500 hover:-translate-y-1 bg-white/60",
          theme.border, // border-color
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "p-3 rounded-2xl shadow-sm transition-colors duration-500",
              theme.bg, // bg-color
            )}
          >
            <BookOpen
              className={cn(
                "w-6 h-6 transition-colors duration-500",
                theme.activeText, // text-color
              )}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-0.5 tracking-tight">
              {t("monthly_title", { month })}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-4xl font-bold font-serif transition-all duration-500 group-hover:scale-105",
                  theme.activeText, // text-color
                )}
              >
                <AnimatedNumber value={stats.monthlyCount} />
              </span>
              <span className="text-sm font-medium text-stone-500">
                {t("unit")}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-xs font-medium leading-relaxed break-keep transition-colors duration-500",
              theme.accent, // text-color
            )}
          >
            {getMessage(stats.monthlyCount)}
          </p>
        </div>
      </div>

      {/* 연간 누적 카드 */}
      <div className="group p-5 rounded-3xl flex items-center justify-between border bg-white/80 backdrop-blur-md border-stone-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-stone-100 shadow-inner">
            <Library className="w-6 h-6 text-stone-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-0.5 tracking-tight">
              {t("yearly_title", { year })}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-bold font-serif text-stone-700 transition-transform duration-200 group-hover:scale-105">
                <AnimatedNumber value={stats.yearlyCount} />
              </span>
              <span className="text-sm font-medium text-stone-500">
                {t("unit")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
