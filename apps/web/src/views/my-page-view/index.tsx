"use client";

import {
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronRight,
  Heart,
  MessageSquare,
  Pencil,
  ShoppingBag,
  User,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { UserStatsDashboard } from "@/features/user/components/dashboard/user-stats-dashboard";
import { ProfileEditModal } from "@/features/user/components/profile/profile-edit-modal";
import { WithdrawalModal } from "@/features/user/components/profile/withdrawal-modal";
import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

export const MyPageView = () => {
  const t = useTranslations("my_page");
  const user = useAuthStore((state) => state.user);
  const locale = useLocale();

  // 활동 메뉴 정의
  const activityMenus = [
    {
      icon: CalendarDays,
      label: t("menu.reading_log.label"),
      description: t("menu.reading_log.desc"),
      href: PATHS.READING_LOG,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
    },
    {
      icon: ShoppingBag,
      label: t("menu.sales.label"),
      description: t("menu.sales.desc"),
      href: PATHS.MY_PAGE_SALES,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
    },
    {
      icon: BookOpen,
      label: t("menu.reviews.label"),
      description: t("menu.reviews.desc"),
      href: PATHS.MY_REVIEWS,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: Heart,
      label: t("menu.wishlist.label"),
      description: t("menu.wishlist.desc"),
      href: PATHS.MY_PAGE_WISHLIST,
      color: "text-rose-500",
      bgColor: "bg-rose-50",
    },
    {
      icon: MessageSquare,
      label: t("menu.comments.label"),
      description: t("menu.comments.desc"),
      href: PATHS.MY_COMMENTS,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
  ];

  if (!user) {
    return null;
  }

  // 프로필 이미지 URL 변환 (기본 프로필 식별자 → 실제 경로)
  const profileImageSrc = getProfileImageUrl(user.profileImageUrl);

  return (
    <div className="container mx-auto w-full px-4 py-8" data-clarity-mask="true">
      <h1 className="mb-8 text-3xl font-bold">{t("title")}</h1>

      {/* 프로필 섹션 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* 아바타 */}
            <div
              className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100"
              data-nosnippet
            >
              {profileImageSrc ? (
                <Image
                  src={profileImageSrc}
                  alt={user.nickname}
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <User className="h-10 w-10 text-stone-400" />
              )}
            </div>

            {/* 사용자 정보 */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <h2 className="text-xl font-semibold text-stone-900">
                  {user.nickname}
                </h2>
                <ProfileEditModal
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-stone-400 hover:text-stone-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
              <p className="mt-1 text-sm text-stone-500">{user.email}</p>
              {user.createdAt && (
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-stone-400 sm:justify-start">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {t("profile.joined", {
                      date: formatDate(user.createdAt, locale, "yearMonth"),
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 통계 대시보드 */}
      <UserStatsDashboard />

      {/* 활동 메뉴 */}
      <h3 className="mb-4 text-lg font-semibold">{t("activity_manage")}</h3>
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {activityMenus.map((menu) => (
          <Link key={menu.href} href={menu.href} className="block">
            <Card className="h-full transition-colors hover:bg-stone-50">
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`rounded-xl p-3 ${menu.bgColor}`}>
                  <menu.icon className={`h-5 w-5 ${menu.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">{menu.label}</p>
                  <p className="truncate text-xs text-stone-500">
                    {menu.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-stone-300" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 위험 구역 (탈퇴) */}
      <div className="border-t pt-8">
        <h3 className="mb-4 text-lg font-semibold text-red-600">
          {t("danger_zone.title")}
        </h3>
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-red-100 bg-red-50 p-6 sm:flex-row sm:items-center">
          <div>
            <h4 className="font-medium text-red-900">
              {t("danger_zone.withdraw_title")}
            </h4>
            <p className="mt-1 text-sm text-red-700">
              {t("danger_zone.withdraw_desc")}
            </p>
          </div>
          <WithdrawalModal />
        </div>
      </div>
    </div>
  );
};
