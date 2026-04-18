"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { useLoungePopularQuery } from "@/features/reading-log/queries";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { LoungePopularBannerCard } from "./lounge-popular-banner-card";

export function LoungePopularBanner() {
  const t = useTranslations("lounge.popular");
  const { data, isLoading } = useLoungePopularQuery();

  if (isLoading) {
    return (
      <section>
        <div className="mb-10">
          <Skeleton className="h-8 w-48 mb-3" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-44 shrink-0">
              <Skeleton className="aspect-2/3 w-full rounded-xl mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.items.length === 0) return null;

  return (
    <section>
      {/* 섹션 헤더: 기존 슬라이더 헤더 패턴 */}
      <div className="mb-10 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm sm:text-base text-stone-500 font-light">
          {t("subtitle")}
        </p>
      </div>

      {/* 수평 스크롤 카드 */}
      <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {data.items.map((item, index) => (
          <LoungePopularBannerCard
            key={item.isbn}
            item={item}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}
