"use client";

import { LoungeBookCard } from "@bookjeok/core";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";
import { cn } from "@/shared/utils/cn";
import { formatRelativeTime } from "@/shared/utils/format-date";

interface LoungeFeedCardProps {
  item: LoungeBookCard;
  onCardClick: (isbn: string) => void;
}

export function LoungeFeedCard({ item, onCardClick }: LoungeFeedCardProps) {
  const t = useTranslations("lounge.feed");
  const locale = useLocale();

  return (
    <div
      onClick={() => onCardClick(item.isbn)}
      className={cn(
        "group relative flex gap-5 p-4 rounded-2xl cursor-pointer",
        "bg-white border border-stone-100",
        "transition-all duration-300",
        "hover:shadow-md hover:border-stone-200 hover:-translate-y-0.5",
      )}
    >
      {/* 도서 표지 */}
      <div className="relative shrink-0 w-20 sm:w-24 aspect-2/3 rounded-xl overflow-hidden bg-stone-50">
        {item.book.image ? (
          <Image
            src={item.book.image}
            alt={item.book.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-2">
            <span className="text-[10px] text-stone-300 font-medium text-center">
              {item.book.title}
            </span>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
        {/* 제목 + 날짜 */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base sm:text-lg font-semibold text-stone-900 leading-snug line-clamp-1">
            {item.book.title}
          </h3>
          <span className="text-[11px] text-stone-400 font-light shrink-0 mt-0.5">
            {formatRelativeTime(item.latestDate, locale)}
          </span>
        </div>

        {/* 저자 */}
        <p className="text-sm text-stone-400 font-light mb-4 line-clamp-1">
          {item.book.author}
        </p>

        {/* Avatar Circles + 독자 수 */}
        <div className="flex items-center gap-2 mt-auto">
          <AvatarCircles
            size="sm"
            avatars={item.readers.slice(0, 4).map((r) => ({
              imageUrl: r.profileImageUrl,
              name: r.nickname,
            }))}
            extraCount={0}
          />
          {item.totalReaderCount > 4 ? (
            <span className="text-xs text-stone-500 font-medium">
              {t("readers_extra", { count: item.totalReaderCount - 4 })}
            </span>
          ) : (
            <span className="text-xs text-stone-500 font-medium">
              {t("readers_reading", { count: item.totalReaderCount })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
