"use client";

import Image from "next/image";

import { cn } from "@/shared/utils/cn";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface AvatarCirclesProps {
  className?: string;
  /** 아바타 목록 (이미지 URL, fallback 텍스트) */
  avatars: {
    imageUrl: string | null;
    name: string;
  }[];
  /** 추가 인원 수 (+N명 뱃지) */
  extraCount?: number;
  /** 아바타 크기 (기본 32px) */
  size?: "sm" | "md" | "lg";
  /** 클릭 핸들러 */
  onAvatarClick?: (index: number) => void;
}

const sizeConfig = {
  sm: { avatar: "h-7 w-7", text: "text-[10px]", overlap: "-ml-2" },
  md: { avatar: "h-9 w-9", text: "text-xs", overlap: "-ml-3" },
  lg: { avatar: "h-11 w-11", text: "text-sm", overlap: "-ml-3.5" },
};

export function AvatarCircles({
  className,
  avatars,
  extraCount = 0,
  size = "md",
  onAvatarClick,
}: AvatarCirclesProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center", className)}>
      {avatars.map((avatar, i) => {
        const imageUrl = getProfileImageUrl(avatar.imageUrl);
        return (
          <div
            key={i}
            className={cn(
              config.avatar,
              i > 0 && config.overlap,
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
              "border-2 border-white bg-stone-100 ring-0",
              "transition-transform duration-200 hover:scale-110 hover:z-10",
              onAvatarClick && "cursor-pointer",
            )}
            style={{ zIndex: avatars.length - i }}
            onClick={() => onAvatarClick?.(i)}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={avatar.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className={cn(config.text, "font-medium text-stone-500")}>
                {avatar.name.charAt(0)}
              </span>
            )}
          </div>
        );
      })}
      {extraCount > 0 && (
        <span className="ml-1.5 text-xs font-medium text-stone-500 tracking-tight">
          +{extraCount}
        </span>
      )}
    </div>
  );
}
