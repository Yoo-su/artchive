"use client";

import { useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface UserInfo {
  id: number;
  handle?: string | null;
  nickname: string;
  profileImageUrl?: string | null;
}

interface UserAvatarMenuProps {
  user: UserInfo;
  /** 닉네임 표시 여부 */
  showNickname?: boolean;
  /** 추가 라벨 (예: "판매자") */
  label?: string;
  /** 아바타 크기 */
  size?: "sm" | "md" | "lg";
  /** 툴팁 표시 방향 */
  tooltipSide?: "top" | "right" | "bottom" | "left";
  /** 툴팁 정렬 */
  tooltipAlign?: "start" | "center" | "end";
  /** @deprecated tooltipSide 사용 권장 */
  menuSide?: "top" | "right" | "bottom" | "left";
  /** @deprecated tooltipAlign 사용 권장 */
  menuAlign?: "start" | "center" | "end";
  className?: string;
}

/**
 * 사용자 아바타 컴포넌트
 * - 호버 시: "프로필 보기" 툴팁 노출
 * - 클릭 시: 해당 사용자의 프로필 페이지로 바로 이동
 */
export function UserAvatarMenu({
  user,
  showNickname = false,
  label,
  size = "md",
  tooltipSide,
  tooltipAlign,
  menuSide = "bottom",
  menuAlign = "center",
  className,
}: UserAvatarMenuProps) {
  const t = useTranslations("common");

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const side = tooltipSide ?? menuSide;
  const align = tooltipAlign ?? menuAlign;

  const avatarContent = (
    <>
      <Avatar
        className={cn(sizeClasses[size], "border border-stone-200 shrink-0")}
      >
        <AvatarImage
          src={getProfileImageUrl(user.profileImageUrl)}
          alt={user.nickname}
        />
        <AvatarFallback className="bg-stone-100 text-stone-600 text-xs">
          {user.nickname?.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {showNickname && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
            {user.nickname}
          </span>
          {label && (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {label}
            </span>
          )}
        </div>
      )}
    </>
  );

  // 핸들이 없는 경우 단순 뷰만 표시
  if (!user?.handle) {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        {avatarContent}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={PATHS.USER_PROFILE(user.handle)}
          className={cn(
            "inline-flex items-center gap-2 focus:outline-none transition-opacity hover:opacity-80 rounded-full",
            className,
          )}
          aria-label={t("aria.user_profile_menu", { name: user.nickname })}
        >
          {avatarContent}
        </Link>
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {t("actions.view_profile")}
      </TooltipContent>
    </Tooltip>
  );
}
