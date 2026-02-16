import Image from "next/image";

import { ArtItem } from "@/features/art/types";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface MainArtCardProps {
  item: ArtItem;
}

// 공연/전시 카드 컴포넌트 - 포스터 중심 미니멀 디자인
export const MainArtCard = ({ item }: MainArtCardProps) => {
  return (
    <Link href={PATHS.ART_DETAIL(item.mt20id)} passHref>
      <div className="group relative w-full">
        {/* 포스터 이미지 */}
        <div className="relative aspect-3/4 overflow-hidden bg-stone-200">
          <Image
            src={item.poster}
            alt={item.prfnm}
            fill
            sizes="260px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* 호버 시 미세한 어두움 효과 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>

        {/* 콘텐츠 - 미니멀 텍스트 정보 */}
        <div className="pt-3 space-y-1">
          <h3 className="text-sm font-medium text-stone-900 line-clamp-2 leading-snug group-hover:text-stone-600 transition-colors duration-300">
            {item.prfnm}
          </h3>
          <p className="text-xs text-stone-400 truncate font-light">
            {item.fcltynm}
          </p>
          <p className="text-[11px] text-stone-300 font-light">
            {item.prfpdfrom} ~ {item.prfpdto}
          </p>
        </div>
      </div>
    </Link>
  );
};
