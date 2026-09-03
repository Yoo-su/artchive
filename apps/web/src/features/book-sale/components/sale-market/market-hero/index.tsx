"use client";

import {
  useBookSaleRegionsQuery,
  useRecentBookSalesQuery,
} from "@bookjeok/react-query";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { GravityStarsBackground } from "@/shared/components/animateui/gravity-stars";
import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

import { LiveListingFeed } from "./live-listing-feed";

/** 홈 슬라이더와 캐시를 공유하기 위해 동일한 limit 사용 */
const RECENT_LIMIT = 25;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
/** 히어로는 실시간성이 중요하므로 전역 staleTime(1분)을 더 짧게 덮어쓴다. */
const LIVE_REFRESH_MS = 60 * 1000;

export const MarketHero = () => {
  const t = useTranslations("market.hero");
  const prefersReducedMotion = usePrefersReducedMotion();

  const { data: recentSales, isLoading } = useRecentBookSalesQuery(
    RECENT_LIMIT,
    {
      staleTime: LIVE_REFRESH_MS,
      refetchInterval: LIVE_REFRESH_MS,
      refetchOnMount: true,
    },
  );
  const { data: regions } = useBookSaleRegionsQuery();

  const sales = useMemo(() => recentSales ?? [], [recentSales]);

  /**
   * 히어로에 노출하는 수치는 모두 실제 데이터에서 계산한다.
   * 최근 목록을 limit개만 받아오므로, 전부 24시간 이내면 "N+"로 표기한다.
   */
  const { freshCount, newTodayLabel, regionCount, sellers } = useMemo(() => {
    const now = Date.now();
    const freshCount = sales.filter(
      (sale) => now - new Date(sale.createdAt).getTime() < DAY_IN_MS,
    ).length;

    const uniqueSellers = new Map<
      number,
      { imageUrl: string | null; name: string }
    >();
    for (const sale of sales) {
      if (!sale.user || uniqueSellers.has(sale.user.id)) continue;
      uniqueSellers.set(sale.user.id, {
        imageUrl: sale.user.profileImageUrl,
        name: sale.user.nickname,
      });
    }

    return {
      freshCount,
      newTodayLabel:
        freshCount >= RECENT_LIMIT ? `${RECENT_LIMIT}+` : String(freshCount),
      regionCount: regions
        ? Object.values(regions).reduce(
            (total, districts) => total + districts.length,
            0,
          )
        : 0,
      sellers: [...uniqueSellers.values()],
    };
  }, [sales, regions]);

  const hasStats = freshCount > 0 || regionCount > 0 || sellers.length > 0;

  return (
    <section className="relative -mx-4 mb-10 overflow-hidden bg-[#0A0A0A] sm:-mx-6 md:mb-14">
      {/* 배경 레이어 (장식용) */}
      <div aria-hidden className="absolute inset-0">
        {!prefersReducedMotion && (
          <GravityStarsBackground
            className="absolute inset-0 text-white"
            starsCount={90}
            starsSize={1.5}
            starsOpacity={1}
            glowIntensity={8}
            movementSpeed={0.16}
            mouseInfluence={150}
            mouseGravity="attract"
            gravityStrength={55}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(72%_58%_at_84%_0%,rgba(255,255,255,0.09),transparent_62%),radial-gradient(62%_62%_at_0%_100%,rgba(255,255,255,0.05),transparent_62%)]" />
      </div>

      {/*
        본문은 pointer-events-none으로 두어 마우스 이동이 배경 캔버스까지 전달되게 하고,
        실제로 눌러야 하는 요소에만 pointer-events-auto를 다시 켠다.
      */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none relative z-10 grid gap-9 px-6 py-12 sm:px-9 sm:py-14 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center md:gap-12 md:px-12 md:py-16"
      >
        <div>
          <h1 className="break-keep font-(family-name:--font-gowun-batang) text-[1.9rem] leading-[1.28] sm:text-[2.4rem] md:text-[2.85rem]">
            <span className="block text-neutral-500">{t("title_lead")}</span>
            <span className="block text-neutral-50">{t("title_main")}</span>
          </h1>

          <p className="mt-6 max-w-md whitespace-pre-line break-keep text-[13.5px] leading-relaxed text-neutral-400 sm:text-[15px]">
            {t("description")}
          </p>

          <Link
            href={PATHS.BOOK_SALES_REGISTER}
            className="pointer-events-auto group mt-8 inline-flex items-center gap-2.5 bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
          >
            {t("cta_sell")}
            <ArrowUpRight
              className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>

          {/*
            실데이터 기반 지표. 값이 0인 항목은 렌더링하지 않는다.
            판매글이 없는 초기 서비스에서 "0"을 크게 노출하면 비어 있다는 인상만 남는다.
          */}
          {hasStats && (
            <div className="mt-10 flex flex-wrap items-end gap-x-7 gap-y-5 border-t border-white/10 pt-6 sm:gap-x-9">
              {freshCount > 0 && (
                <StatCell
                  value={newTodayLabel}
                  label={t("stats.new_listings")}
                />
              )}
              {regionCount > 0 && (
                <StatCell
                  value={String(regionCount)}
                  label={t("stats.regions")}
                />
              )}
              {sellers.length > 0 && (
                <div>
                  <div className="flex h-[26px] items-center">
                    <AvatarCircles
                      avatars={sellers.slice(0, 4)}
                      extraCount={Math.max(0, sellers.length - 4)}
                      size="sm"
                      className="[&>div]:h-6 [&>div]:w-6 [&>div]:border-[#0A0A0A]"
                    />
                  </div>
                  <span className="mt-2.5 block text-[11px] tracking-tight text-neutral-500">
                    {t("stats.sellers")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <LiveListingFeed
          sales={sales}
          isLoading={isLoading}
          paused={prefersReducedMotion}
        />
      </motion.div>
    </section>
  );
};

const StatCell = ({ value, label }: { value: string; label: string }) => (
  <div>
    <span className="block font-(family-name:--font-gowun-batang) text-2xl leading-none tabular-nums text-neutral-50 sm:text-[26px]">
      {value}
    </span>
    <span className="mt-2.5 block text-[11px] tracking-tight text-neutral-500">
      {label}
    </span>
  </div>
);
