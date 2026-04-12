import { PublicUserProfile, SaleStatus } from "@bookjeok/core";
import { BookOpen, Calendar, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { SaleStatusBadge } from "@/features/book-sale/components/common/sale-status-badge";
import { ReadingTimeline } from "@/features/reading-log/components/stats-view/reading-timeline";
import { usePublicProfileQuery } from "@/features/user/queries";
import { Card, CardContent, CardHeader } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface UserProfileProps {
  handle: string;
}

/**
 * 유저 프로필 메인 컴포넌트
 * - 내부에서 쿼리 호출 및 로딩/에러 상태 처리
 * - 하위 Presentational 컴포넌트들로 구성
 */
export const UserProfile = ({ handle }: UserProfileProps) => {
  const t = useTranslations("user_profile");
  const { data: profile, isLoading, error } = usePublicProfileQuery(handle);

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (error || !profile) {
    return <NotFoundRedirect message={t("not_found")} useBack />;
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8" data-clarity-mask="true">
      <UserProfileHeader profile={profile} />
      <UserProfileStats stats={profile.stats} />

      {/* 독서 기록 타임라인 */}
      {profile.readingLogs && profile.readingLogs.length > 0 && (
        <div className="mb-8">
          <ReadingTimeline logs={profile.readingLogs} />
        </div>
      )}

      {/* 최근 리뷰 */}
      {profile.recentReviews.length > 0 && (
        <UserRecentReviews reviews={profile.recentReviews} />
      )}

      {/* 최근 판매글 */}
      {profile.recentSales.length > 0 && (
        <UserRecentSales sales={profile.recentSales} />
      )}
    </div>
  );
};

/**
 * 프로필 헤더 - 아바타, 닉네임, 가입일
 */
interface UserProfileHeaderProps {
  profile: Pick<
    PublicUserProfile,
    "profileImageUrl" | "nickname" | "createdAt"
  >;
}

const UserProfileHeader = ({ profile }: UserProfileHeaderProps) => {
  const t = useTranslations("user_profile");
  const locale = useLocale();

  return (
    <Card className="mb-8">
      <CardContent className="flex items-center gap-4 p-4 sm:gap-6 sm:p-6">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 sm:h-24 sm:w-24">
          {getProfileImageUrl(profile.profileImageUrl) ? (
            <Image
              src={getProfileImageUrl(profile.profileImageUrl)!}
              alt={profile.nickname}
              fill
              unoptimized
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-stone-400 sm:h-12 sm:w-12" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-stone-900 sm:text-2xl">
            {profile.nickname}
          </h1>
          <div className="mt-1 flex items-center gap-1 text-xs text-stone-500 sm:text-sm">
            <Calendar className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="truncate">
              {t("joined", {
                date: formatDate(profile.createdAt, locale, "yearMonth"),
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
      <Card>
        <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <div className="shrink-0 rounded-full bg-emerald-50 p-2 sm:p-3">
            <ShoppingBag className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-stone-900 sm:text-2xl">
              {stats.salesCount}
            </p>
            <p className="truncate text-xs text-stone-500 sm:text-sm">
              {t("sales_count")}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          <div className="shrink-0 rounded-full bg-blue-50 p-2 sm:p-3">
            <BookOpen className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-stone-900 sm:text-2xl">
              {stats.reviewsCount}
            </p>
            <p className="truncate text-xs text-stone-500 sm:text-sm">
              {t("reviews_count")}
            </p>
          </div>
        </CardContent>
      </Card>
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
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <h2 className="text-lg font-semibold">{t("recent_reviews")}</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={PATHS.REVIEW_DETAIL(review.id)}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-stone-50"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
              {review.bookImage ? (
                <Image
                  src={review.bookImage}
                  alt={review.bookTitle}
                  fill
                  unoptimized
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BookOpen className="h-5 w-5 text-stone-300" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-stone-900">
                {review.title}
              </p>
              <p className="truncate text-sm text-stone-500">
                {review.bookTitle}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-lg font-semibold">{t("recent_sales")}</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {sales.map((sale) => (
          <Link
            key={sale.id}
            href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
            className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-stone-50"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
              {sale.bookImage ? (
                <Image
                  src={sale.bookImage}
                  alt={sale.bookTitle}
                  fill
                  unoptimized
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-stone-300" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-stone-900">
                {sale.bookTitle}
              </p>
              <p className="text-sm text-stone-500">
                {sale.price.toLocaleString()}원
              </p>
            </div>
            <SaleStatusBadge status={sale.status as SaleStatus} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

/**
 * 로딩 스켈레톤
 */
export const UserProfileSkeleton = () => (
  <div className="container mx-auto max-w-4xl px-4 py-8">
    <Card className="mb-8">
      <CardContent className="flex items-center gap-4 p-4 sm:gap-6 sm:p-6">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-24 max-w-full sm:h-7 sm:w-32" />
          <Skeleton className="h-3.5 w-32 max-w-full sm:h-4 sm:w-48" />
        </div>
      </CardContent>
    </Card>
    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
      <Skeleton className="h-20 rounded-lg sm:h-24" />
      <Skeleton className="h-20 rounded-lg sm:h-24" />
    </div>
    <Skeleton className="h-48 rounded-lg" />
  </div>
);
