import type { LoungePopularBook } from "@bookjeok/core";
import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";

interface LoungePopularBannerCardProps {
  item: LoungePopularBook;
  index?: number;
}

export function LoungePopularBannerCard({ item, index = 0 }: LoungePopularBannerCardProps) {
  const t = useTranslations("lounge.popular");
  const book = item.book;
  const image = book?.image;
  const title = book?.title || "제목 정보 없음";
  const author = book?.author || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="shrink-0 w-40 sm:w-44 group"
    >
      {/* 도서 표지 */}
      <div className="relative aspect-2/3 w-full rounded-xl overflow-hidden bg-stone-100 mb-3.5 shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-3">
            <span className="text-xs text-stone-400 text-center font-medium">
              {title}
            </span>
          </div>
        )}

        {/* 독자 수 뱃지 */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
          {t("readers_count", { count: item.readerCount })}
        </div>
      </div>

      {/* 도서 정보 */}
      <h3 className="text-sm font-semibold text-stone-900 line-clamp-2 leading-snug mb-1.5 group-hover:text-stone-600 transition-colors">
        {title}
      </h3>
      <p className="text-xs text-stone-400 font-light mb-3 line-clamp-1">
        {author}
      </p>

      {/* Avatar Circles */}
      <AvatarCircles
        size="sm"
        avatars={item.recentReaders.map((r) => ({
          imageUrl: r.profileImageUrl,
          name: r.nickname,
        }))}
        extraCount={
          item.readerCount > item.recentReaders.length
            ? item.readerCount - item.recentReaders.length
            : 0
        }
      />
    </motion.div>
  );
}
