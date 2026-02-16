"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { BorderBeam } from "@/shared/components/magicui/border-beam";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { cn } from "@/shared/utils/cn";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { SaleStatusBadge } from "../sale-status-badge";
import { useBookSaleContext } from "./context";

// 이미지 영역 - 전체 배경으로 사용
export const ImageArea = ({ className }: { className?: string }) => {
  const { sale, rank, priority } = useBookSaleContext();

  return (
    <div
      className={cn(
        "relative aspect-3/4 w-full overflow-hidden bg-stone-100",
        className,
      )}
    >
      <Image
        src={sale.imageUrls[0] || "/images/placeholder-image.svg"}
        alt={sale.title}
        title={sale.title}
        fill
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* 하단 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />

      {/* 순위 배지 - 좌상단 */}
      {rank && (
        <div className="absolute top-2 left-2">
          <span className="text-xl font-bold text-white/90 drop-shadow-md">
            {rank}
          </span>
        </div>
      )}

      {/* 상태 배지 - 우상단 */}
      <SaleStatusBadge
        status={sale.status}
        className="absolute right-2 top-2 shadow-none border-none bg-black/50 text-white text-[10px]"
      />
    </div>
  );
};

// 콘텐츠 영역 - 이미지 위 하단 오버레이로 표시
export const Content = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("absolute bottom-0 left-0 right-0 p-3 z-10", className)}>
      {children}
    </div>
  );
};

// 제목
export const Title = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <h3
      className={cn(
        "line-clamp-1 text-sm font-semibold text-white leading-tight mb-0.5 drop-shadow-sm",
        className,
      )}
    >
      {sale.title}
    </h3>
  );
};

// 가격
export const Price = ({ className }: { className?: string }) => {
  const t = useTranslations("common");
  const { sale } = useBookSaleContext();
  return (
    <div className={cn("mb-1", className)}>
      <p className="text-sm font-bold text-white drop-shadow-sm">
        {sale.price.toLocaleString()}
        {t("won")}
      </p>
    </div>
  );
};

// 위치 정보
export const Location = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[10px] text-white/70 mb-1",
        className,
      )}
    >
      <span>
        {sale.city} {sale.district}
      </span>
    </div>
  );
};

// 메타 정보
export const Meta = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <div
      className={cn(
        "flex items-center justify-between pt-1.5 border-t border-white/20",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Avatar className="h-4 w-4" data-nosnippet>
          <AvatarImage src={getProfileImageUrl(sale.user.profileImageUrl)} />
          <AvatarFallback className="text-[8px] bg-white/20 text-white">
            {sale.user.nickname.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="text-[10px] text-white/70 truncate max-w-[80px]">
          {sale.user.nickname}
        </span>
      </div>
      <span className="text-[10px] text-white/50">
        {sale.viewCount?.toLocaleString() || 0} views
      </span>
    </div>
  );
};

// 효과 (BorderBeam)
export const Effect = ({
  duration = 8,
  delay = 0,
}: {
  duration?: number;
  delay?: number;
}) => {
  return <BorderBeam duration={duration} delay={delay} />;
};
