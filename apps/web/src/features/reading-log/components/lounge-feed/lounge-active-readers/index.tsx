"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useLoungeActiveReadersQuery } from "@/features/reading-log/queries";

import { ReaderRow } from "./reader-row";
import { LoungeActiveReadersSkeleton } from "./skeleton";

export function LoungeActiveReaders() {
  const t = useTranslations("lounge.active_readers");
  const { data, isLoading } = useLoungeActiveReadersQuery();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return <LoungeActiveReadersSkeleton />;
  }

  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  // 기본적으로 1, 2, 3위 노출, 더보기 활성화 시 최대 10위 노출
  const visibleItems = isExpanded
    ? data.items.slice(0, 10)
    : data.items.slice(0, 3);

  const hasMoreThanThree = data.items.length > 3;

  return (
    <section className="mb-14">
      {/* 섹션 헤더: 인기 책 슬라이더와 디자인 일치 */}
      <div className="mb-6 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-stone-500 font-light">
          {t("subtitle")}
        </p>
      </div>

      {/* 테이블 리스트 */}
      <div className="flex flex-col border-t border-stone-200/80">
        {visibleItems.map((item, idx) => (
          <ReaderRow key={item.user.id} item={item} rank={idx + 1} />
        ))}
      </div>

      {/* 접기/펼치기 버튼 */}
      {hasMoreThanThree && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-6 py-2.5 rounded-full border border-stone-200 text-stone-600 text-xs sm:text-sm font-medium hover:bg-stone-50 hover:text-stone-800 hover:border-stone-300 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1"
          >
            <span>{isExpanded ? t("collapse") : t("more")}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
