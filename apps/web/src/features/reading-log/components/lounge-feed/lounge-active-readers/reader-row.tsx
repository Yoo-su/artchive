"use client";

import { ActiveReader } from "@bookjeok/core";
import { useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface ReaderRowProps {
  item: ActiveReader;
  rank: number;
}

export const ReaderRow = ({ item, rank }: ReaderRowProps) => {
  const t = useTranslations("lounge.active_readers");
  const { user, recentCount, totalCount } = item;

  return (
    <div className="flex items-center justify-between py-4 border-b border-stone-100 hover:bg-stone-50/50 px-3 sm:px-5 -mx-2 sm:-mx-4 rounded-xl transition-all duration-300 ease-out">
      {/* 좌측 영역: 순위 + 아바타 + 닉네임 */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* 순위 배지 */}
        <span className="flex items-center justify-center w-6 h-6 rounded-full border border-stone-200/30 bg-stone-50/20 text-xs font-semibold text-stone-600 shrink-0 leading-none">
          {rank}
        </span>

        {/* 아바타 & 닉네임 링크 */}
        <Link
          href={PATHS.USER_PROFILE(user.handle)}
          className="flex items-center gap-3 sm:gap-4 min-w-0 group/link outline-hidden rounded-lg"
        >
          {/* 아바타 */}
          <Avatar className="w-8 h-8 sm:w-9 sm:h-9 border border-stone-200/80 shrink-0 group-hover/link:border-stone-400 transition-colors">
            <AvatarImage
              src={getProfileImageUrl(user.profileImageUrl)}
              alt={user.nickname}
            />
            <AvatarFallback className="bg-stone-100 text-[10px] sm:text-xs font-light text-stone-400">
              {user.nickname?.[0] || "U"}
            </AvatarFallback>
          </Avatar>

          {/* 닉네임 */}
          <span className="font-medium text-stone-800 text-sm sm:text-base truncate group-hover/link:text-stone-900 group-hover/link:underline decoration-stone-300 transition-colors underline-offset-4">
            {user.nickname}
          </span>
        </Link>
      </div>

      {/* 우측 영역: 독서 지표 통계 */}
      <div className="flex items-center gap-4 sm:gap-6 text-right shrink-0 pl-3">
        {/* 근 3개월 독서 기록 수 */}
        <div className="flex flex-col">
          <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-wider font-light mb-0.5">
            {t("recent_label")}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-stone-700">
            {t("count_unit", { count: recentCount })}
          </span>
        </div>

        {/* 누적 독서 기록 수 */}
        <div className="flex flex-col border-l border-stone-100 pl-4 sm:pl-6">
          <span className="text-[9px] sm:text-[10px] text-stone-400 uppercase tracking-wider font-light mb-0.5">
            {t("total_label")}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-stone-700">
            {t("count_unit", { count: totalCount })}
          </span>
        </div>
      </div>
    </div>
  );
};

