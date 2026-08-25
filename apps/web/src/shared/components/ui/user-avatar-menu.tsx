"use client";

import { User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface UserInfo {
  id: number;
  handle: string;
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
  /** 메뉴 표시 방향 */
  menuSide?: "top" | "right" | "bottom" | "left";
  /** 메뉴 정렬 */
  menuAlign?: "start" | "center" | "end";
  className?: string;
}

/**
 * 사용자 아바타 및 프로필 메뉴 컴포넌트
 * - 로그인 상태: 아바타 클릭 시 프로필 보기 메뉴 노출
 * - 비로그인 상태: 아바타만 노출 (메뉴 없음)
 */
export function UserAvatarMenu({
  user,
  showNickname = false,
  label,
  size = "md",
  menuSide = "bottom",
  menuAlign = "end",
  className,
}: UserAvatarMenuProps) {
  const t = useTranslations("common");
  const currentUser = useAuthStore((state) => state.user);
  const isLoggedIn = !!currentUser;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 모바일 터치 환경에서 메뉴 닫힘 처리
  useEffect(() => {
    const handleTouchOutside = () => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("touchstart", handleTouchOutside);
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [isMenuOpen]);

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const avatarContent = (
    <div className={cn("flex items-center gap-2 cursor-pointer", className)}>
      <Avatar className={cn(sizeClasses[size], "border border-stone-200")}>
        <AvatarImage
          src={getProfileImageUrl(user.profileImageUrl)}
          alt={user.nickname}
        />
        <AvatarFallback className="bg-stone-100 text-stone-600 text-xs">
          {user.nickname.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {showNickname && (
        <div className="flex flex-col text-left">
          <span className="text-sm font-medium text-stone-800">
            {user.nickname}
          </span>
          {label && <span className="text-xs text-stone-500">{label}</span>}
        </div>
      )}
    </div>
  );

  // 비로그인 상태: 메뉴 없이 아바타만 표시
  if (!isLoggedIn) {
    return avatarContent;
  }

  // 로그인 상태: 드롭다운 메뉴
  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center focus:outline-none rounded-lg p-1 -m-1"
          style={{ touchAction: "manipulation" }}
          aria-label={t("aria.user_profile_menu", { name: user.nickname })}
          // 모바일에서 스크롤 시 pointerDown이 메뉴를 열지 않도록 방지
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => setIsMenuOpen((prev: boolean) => !prev)}
        >
          {avatarContent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={menuAlign} side={menuSide} className="w-40">
        <DropdownMenuItem asChild>
          <Link
            href={PATHS.USER_PROFILE(user.handle)}
            className="flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4" />
            <span>{t("actions.view_profile")}</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
