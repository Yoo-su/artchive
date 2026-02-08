"use client";

import { Eye, MapPin } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

import { BorderBeam } from "@/shared/components/magicui/border-beam";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { CardContent } from "@/shared/components/shadcn/card";
import { cn } from "@/shared/utils/cn";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { SaleStatusBadge } from "../sale-status-badge";
import { useBookSaleContext } from "./context";

export const ImageArea = ({ className }: { className?: string }) => {
  const { sale, rank, priority } = useBookSaleContext();

  return (
    <div
      className={cn(
        "relative aspect-4/5 w-full overflow-hidden bg-stone-100",
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
      {/* 텍스트 대비를 위한 미세 오버레이 (현재는 깔끔함을 위해 투명) */}
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />

      {/* 에디토리얼 순위 배지: 심플한 숫자 */}
      {rank && (
        <div className="absolute top-0 left-0 flex items-center justify-center w-8 h-8 bg-white/90 backdrop-blur-sm border-r border-b border-stone-100">
          <span className="font-serif font-bold text-stone-900 text-sm">
            {rank}
          </span>
        </div>
      )}

      {/* 상태 배지 */}
      <SaleStatusBadge
        status={sale.status}
        className="absolute right-2 top-2 shadow-none border-none bg-stone-900/80 text-white backdrop-blur-md"
      />
    </div>
  );
};

export const Content = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <CardContent className={cn("p-3 flex flex-col flex-1", className)}>
      {children}
    </CardContent>
  );
};

export const Title = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <h3
      className={cn(
        "line-clamp-1 font-serif text-lg font-bold text-stone-900 leading-tight mb-1",
        className,
      )}
    >
      {sale.title}
    </h3>
  );
};

export const Price = ({ className }: { className?: string }) => {
  const t = useTranslations("common");
  const { sale } = useBookSaleContext();
  return (
    <div className={cn("mt-1 mb-3", className)}>
      <p className="text-base font-bold text-stone-800">
        {sale.price.toLocaleString()}
        {t("won")}
      </p>
    </div>
  );
};

export const Location = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-stone-500 mb-4",
        className,
      )}
    >
      <MapPin className="w-3 h-3 text-stone-400" />
      <span>
        {sale.city} {sale.district}
      </span>
    </div>
  );
};

export const Meta = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <div
      className={cn(
        "mt-auto flex items-center justify-between pt-3 border-t border-stone-100",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Avatar className="h-5 w-5 ring-1 ring-stone-100" data-nosnippet>
          <AvatarImage src={getProfileImageUrl(sale.user.profileImageUrl)} />
          <AvatarFallback className="text-[9px] bg-stone-100 text-stone-500">
            {sale.user.nickname.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-stone-500 truncate max-w-[80px]">
          {sale.user.nickname}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-stone-400">
        <Eye className="w-3 h-3" />
        <span>{sale.viewCount?.toLocaleString() || 0}</span>
      </div>
    </div>
  );
};

export const Effect = ({
  duration = 8,
  delay = 0,
}: {
  duration?: number;
  delay?: number;
}) => {
  return <BorderBeam duration={duration} delay={delay} />;
};
