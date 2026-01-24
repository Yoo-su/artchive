"use client";

import { Eye, MapPin } from "lucide-react";
import Image from "next/image";
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
        "relative aspect-4/3 w-full overflow-hidden bg-gray-100",
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
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-60" />

      {/* Rank Badge */}
      {rank && (
        <div className="absolute top-0 left-0 bg-black/60 text-white px-3 py-1.5 rounded-br-xl font-bold font-serif text-sm backdrop-blur-sm z-10">
          {rank}
        </div>
      )}

      {/* Status Badge */}
      <SaleStatusBadge
        status={sale.status}
        className="absolute right-2 top-2 shadow-sm"
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
        "line-clamp-1 font-bold text-gray-900 group-hover:text-emerald-600 transition-colors",
        className,
      )}
    >
      {sale.title}
    </h3>
  );
};

export const Price = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <div className={cn("mt-1 mb-2", className)}>
      <p className="text-lg font-bold text-emerald-600">
        {sale.price.toLocaleString()}원
      </p>
    </div>
  );
};

export const Location = ({ className }: { className?: string }) => {
  const { sale } = useBookSaleContext();
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs text-gray-500 mb-3",
        className,
      )}
    >
      <MapPin className="w-3.5 h-3.5" />
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
        "mt-auto flex items-center justify-between pt-3 border-t border-dashed border-gray-100",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Avatar className="h-5 w-5" data-nosnippet>
          <AvatarImage src={getProfileImageUrl(sale.user.profileImageUrl)} />
          <AvatarFallback className="text-[9px]">
            {sale.user.nickname.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs text-gray-500 truncate max-w-[80px]">
          {sale.user.nickname}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
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
