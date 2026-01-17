"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { BookOpen, Calendar, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SaleStatusBadge } from "@/features/book/components/common/sale-status-badge";
import { SaleStatus } from "@/features/book/types";
import { ReadingTimeline } from "@/features/reading-log/components/reading-timeline";
import { usePublicProfileQuery } from "@/features/user/queries";
import { PublicUserProfile } from "@/features/user/types";
import { Card, CardContent, CardHeader } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { PATHS } from "@/shared/constants/paths";

interface UserProfileProps {
  handle: string;
}

/**
 * 유저 프로필 메인 컴포넌트
 * - 내부에서 쿼리 호출 및 로딩/에러 상태 처리
 * - 하위 Presentational 컴포넌트들로 구성
 */
export const UserProfile = ({ handle }: UserProfileProps) => {
  const { data: profile, isLoading, error } = usePublicProfileQuery(handle);

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <NotFoundRedirect
        message="존재하지 않거나 삭제된 사용자입니다."
        useBack
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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

const UserProfileHeader = ({ profile }: UserProfileHeaderProps) => (
  <Card className="mb-8">
    <CardContent className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden shrink-0">
        {profile.profileImageUrl ? (
          <Image
            src={profile.profileImageUrl}
            alt={profile.nickname}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-cover"
          />
        ) : (
          <User className="w-10 h-10 sm:w-12 sm:h-12 text-stone-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-stone-900 truncate">
          {profile.nickname}
        </h1>
        <div className="flex items-center gap-1 text-xs sm:text-sm text-stone-500 mt-1">
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">
            {format(new Date(profile.createdAt), "yyyy년 M월 가입", {
              locale: ko,
            })}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * 활동 통계 - 판매 수, 리뷰 수
 */
interface UserProfileStatsProps {
  stats: PublicUserProfile["stats"];
}

const UserProfileStats = ({ stats }: UserProfileStatsProps) => (
  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
    <Card>
      <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
        <div className="p-2 sm:p-3 rounded-full bg-emerald-50 shrink-0">
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-stone-900">
            {stats.salesCount}
          </p>
          <p className="text-xs sm:text-sm text-stone-500 truncate">
            판매 중인 도서
          </p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
        <div className="p-2 sm:p-3 rounded-full bg-blue-50 shrink-0">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-stone-900">
            {stats.reviewsCount}
          </p>
          <p className="text-xs sm:text-sm text-stone-500 truncate">
            작성한 리뷰
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

/**
 * 최근 리뷰 목록
 */
interface UserRecentReviewsProps {
  reviews: PublicUserProfile["recentReviews"];
}

const UserRecentReviews = ({ reviews }: UserRecentReviewsProps) => (
  <Card className="mb-6">
    <CardHeader className="pb-3">
      <h2 className="text-lg font-semibold">최근 리뷰</h2>
    </CardHeader>
    <CardContent className="space-y-3">
      {reviews.map((review) => (
        <Link
          key={review.id}
          href={PATHS.REVIEW_DETAIL(review.id)}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <div className="relative w-12 h-16 rounded overflow-hidden bg-stone-100 shrink-0">
            {review.bookImage ? (
              <Image
                src={review.bookImage}
                alt={review.bookTitle}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-stone-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-900 truncate">
              {review.title}
            </p>
            <p className="text-sm text-stone-500 truncate">
              {review.bookTitle}
            </p>
          </div>
        </Link>
      ))}
    </CardContent>
  </Card>
);

/**
 * 최근 판매 목록
 */
interface UserRecentSalesProps {
  sales: PublicUserProfile["recentSales"];
}

const UserRecentSales = ({ sales }: UserRecentSalesProps) => (
  <Card>
    <CardHeader className="pb-3">
      <h2 className="text-lg font-semibold">최근 판매 도서</h2>
    </CardHeader>
    <CardContent className="space-y-3">
      {sales.map((sale) => (
        <Link
          key={sale.id}
          href={PATHS.BOOK_SALES_DETAIL(String(sale.id))}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors"
        >
          <div className="relative w-12 h-16 rounded overflow-hidden bg-stone-100 shrink-0">
            {sale.bookImage ? (
              <Image
                src={sale.bookImage}
                alt={sale.bookTitle}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-stone-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-stone-900 truncate">
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

/**
 * 로딩 스켈레톤
 */
export const UserProfileSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-4xl">
    <Card className="mb-8">
      <CardContent className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6">
        <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-6 sm:h-7 w-24 sm:w-32 max-w-full" />
          <Skeleton className="h-3.5 sm:h-4 w-32 sm:w-48 max-w-full" />
        </div>
      </CardContent>
    </Card>
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
      <Skeleton className="h-20 sm:h-24 rounded-lg" />
      <Skeleton className="h-20 sm:h-24 rounded-lg" />
    </div>
    <Skeleton className="h-48 rounded-lg" />
  </div>
);
