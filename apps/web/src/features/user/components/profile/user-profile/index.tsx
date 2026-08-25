import { PublicUserProfile, SaleStatus } from "@bookjeok/core";
import { ArrowRight, BookOpen, Calendar, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { SaleStatusBadge } from "@/features/book-sale/components/common/sale-status-badge";
import { ReadingLogCalendar } from "@/features/reading-log/components/calendar-view/reading-log-calendar";
import { usePublicProfileQuery } from "@/features/user/queries";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { PriceDisplay } from "@/shared/components/ui/price-display";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface UserProfileProps {
  handle: string;
}

/**
 * 유저 프로필 메인 컴포넌트
 */
export const UserProfile = ({ handle }: UserProfileProps) => {
  const t = useTranslations("user_profile");
  const { data: profile, isLoading, error } = usePublicProfileQuery(handle);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (error || !profile) {
    return <NotFoundRedirect message={t("not_found")} useBack />;
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10" data-clarity-mask="true">
      <UserProfileHeader profile={profile} />
      <UserProfileStats stats={profile.stats} />

      {/* 독서 기록 캘린더 */}
      {profile.readingLogs && profile.readingLogs.length > 0 && (
        <div className="mb-10 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
                <BookOpen className="h-4 w-4" />
              </span>
              <h3 className="font-serif text-xl font-semibold text-stone-900">
                {t("reading_log_calendar_title", { name: profile.nickname })}
              </h3>
            </div>
            <span className="text-xs text-stone-400">{t("sections.badge_calendar")}</span>
          </div>
          <ReadingLogCalendar
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            readOnly
            initialLogs={profile.readingLogs}
          />
        </div>
      )}

      {/* 최근 리뷰 및 최근 판매글 (2-column layout) */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {profile.recentReviews.length > 0 && (
          <UserRecentReviews reviews={profile.recentReviews} />
        )}
        {profile.recentSales.length > 0 && (
          <UserRecentSales sales={profile.recentSales} />
        )}
      </div>
    </div>
  );
};

/**
 * 프로필 헤더 - 아바타, 닉네임, 가입일
 */
interface UserProfileHeaderProps {
  profile: Pick<
    PublicUserProfile,
    "profileImageUrl" | "nickname" | "createdAt" | "handle"
  >;
}

const UserProfileHeader = ({ profile }: UserProfileHeaderProps) => {
  const t = useTranslations("user_profile");
  const locale = useLocale();
  const profileImageSrc = getProfileImageUrl(profile.profileImageUrl);

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs sm:p-8">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-stone-100 bg-stone-50 shadow-sm sm:h-28 sm:w-28">
          {profileImageSrc ? (
            <Image
              src={profileImageSrc}
              alt={profile.nickname}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <User className="h-12 w-12 text-stone-400" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {profile.nickname}
            </h1>
            {profile.handle && (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                @{profile.handle}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-stone-500 sm:justify-start sm:text-sm">
            <Calendar className="h-3.5 w-3.5 text-stone-400" />
            <span>
              {t("joined", {
                date: formatDate(profile.createdAt, locale, "yearMonth"),
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 활동 통계 - 판매 수, 리뷰 수
 */
interface UserProfileStatsProps {
  stats: PublicUserProfile["stats"];
}

const UserProfileStats = ({ stats }: UserProfileStatsProps) => {
  const t = useTranslations("user_profile.stats");

  return (
    <div className="mb-8 grid grid-cols-2 gap-4">
      <div className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition-all hover:border-stone-300">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-800">
          <ShoppingBag className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {stats.salesCount}
          </p>
          <p className="truncate text-xs font-medium text-stone-500">
            {t("sales_count")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition-all hover:border-stone-300">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-800">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {stats.reviewsCount}
          </p>
          <p className="truncate text-xs font-medium text-stone-500">
            {t("reviews_count")}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 최근 리뷰 목록
 */
interface UserRecentReviewsProps {
  reviews: PublicUserProfile["recentReviews"];
}

const UserRecentReviews = ({ reviews }: UserRecentReviewsProps) => {
  const t = useTranslations("user_profile.sections");

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-900">
          {t("recent_reviews")}
        </h2>
        <span className="text-xs text-stone-400">{t("badge_recent_reviews")}</span>
      </div>
      <div className="space-y-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={PATHS.REVIEW_DETAIL(review.id)}
            className="group flex items-center gap-3.5 rounded-xl border border-stone-100 bg-stone-50/50 p-3 transition-all hover:border-stone-200 hover:bg-stone-50"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-200 shadow-2xs">
              {review.bookImage ? (
                <Image
                  src={review.bookImage}
                  alt={review.bookTitle}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BookOpen className="h-5 w-5 text-stone-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900 transition-colors group-hover:text-stone-950">
                {review.title}
              </p>
              <p className="mt-0.5 truncate text-xs text-stone-500">
                {review.bookTitle}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-600" />
          </Link>
        ))}
      </div>
    </div>
  );
};

/**
 * 최근 판매 목록
 */
interface UserRecentSalesProps {
  sales: PublicUserProfile["recentSales"];
}

const UserRecentSales = ({ sales }: UserRecentSalesProps) => {
  const t = useTranslations("user_profile.sections");

  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-900">
          {t("recent_sales")}
        </h2>
        <span className="text-xs text-stone-400">{t("badge_recent_sales")}</span>
      </div>
      <div className="space-y-3">
        {sales.map((sale) => (
          <Link
            key={sale.id}
            href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
            className="group flex items-center gap-3.5 rounded-xl border border-stone-100 bg-stone-50/50 p-3 transition-all hover:border-stone-200 hover:bg-stone-50"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-200 shadow-2xs">
              {sale.bookImage ? (
                <Image
                  src={sale.bookImage}
                  alt={sale.bookTitle}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-stone-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900 transition-colors group-hover:text-stone-950">
                {sale.bookTitle}
              </p>
              <div className="mt-0.5">
                <PriceDisplay value={sale.price} size="sm" />
              </div>
            </div>
            <SaleStatusBadge status={sale.status as SaleStatus} />
          </Link>
        ))}
      </div>
    </div>
  );
};

/**
 * 로딩 스켈레톤
 */
export const UserProfileSkeleton = () => (
  <div className="container mx-auto max-w-5xl px-4 py-10">
    <div className="mb-8 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-xs sm:p-8">
      <div className="flex items-center gap-5">
        <Skeleton className="h-24 w-24 rounded-full sm:h-28 sm:w-28" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
    <div className="mb-8 grid grid-cols-2 gap-4">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);
