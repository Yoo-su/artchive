"use client";

import { Tag } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  EmptyState,
  InsightCard,
} from "@/features/insights/components/common/insight-card";
import { PopularTagStat } from "@/features/insights/types";

// 색상 팔레트
const COLORS = {
  matcha: { dark: "#4b6043", medium: "#658354", light: "#7a9968" },
  cream: { light: "#faf7f2", medium: "#f5f0e6", dark: "#e8dfd0" },
  mustard: { dark: "#d4a72c", medium: "#e5b84c", light: "#f0d78c" },
};

interface PopularTagsListProps {
  data: PopularTagStat[];
}

/**
 * 인기 태그 배지 리스트
 */
export const PopularTagsList = ({ data }: PopularTagsListProps) => {
  const t = useTranslations("insights.charts.tags");
  const hasData = data.length > 0;

  const maxCount = Math.max(...data.map((t) => t.count), 1);

  const getBadgeSize = (count: number): string => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-base px-4 py-2";
    if (ratio > 0.4) return "text-sm px-3 py-1.5";
    return "text-xs px-2.5 py-1";
  };

  // 말차색 + 크림 + 머스타드 조합
  const getBadgeStyle = (index: number) => {
    const styles = [
      { bg: COLORS.matcha.dark, color: "#fff" },
      { bg: COLORS.mustard.dark, color: "#fff" },
      { bg: COLORS.matcha.medium, color: "#fff" },
      { bg: COLORS.cream.dark, color: COLORS.matcha.dark },
      { bg: COLORS.mustard.light, color: COLORS.matcha.dark },
      { bg: COLORS.cream.medium, color: COLORS.mustard.dark },
      { bg: COLORS.matcha.light, color: "#fff" },
      { bg: COLORS.cream.light, color: COLORS.matcha.dark },
      { bg: COLORS.mustard.medium, color: COLORS.matcha.dark },
      { bg: COLORS.cream.dark, color: COLORS.mustard.dark },
    ];
    return styles[index % styles.length];
  };

  return (
    <InsightCard
      title={t("title")}
      description={t("desc")}
      icon={<Tag className="h-5 w-5" />}
    >
      {hasData ? (
        <div className="flex flex-wrap gap-2">
          {data.map((tag, index) => {
            const style = getBadgeStyle(index);
            return (
              <span
                key={tag.name}
                className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all hover:scale-105 hover:shadow-sm ${getBadgeSize(tag.count)}`}
                style={{ backgroundColor: style.bg, color: style.color }}
              >
                <span>#{tag.name}</span>
                <span style={{ opacity: 0.7 }}>({tag.count})</span>
              </span>
            );
          })}
        </div>
      ) : (
        <EmptyState message={t("empty")} />
      )}
    </InsightCard>
  );
};
