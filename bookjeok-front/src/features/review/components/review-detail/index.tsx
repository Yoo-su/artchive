"use client";

import { AxiosError } from "axios";
import { Edit } from "lucide-react";
import Link from "next/link";

import { useAuthStore } from "@/features/auth/store";
import { CommentSection } from "@/features/comment/components/comment-section";
import { CommentTargetType } from "@/features/comment/types";
import { getReviewAuthenticated } from "@/features/review/apis";
import {
  useAuthenticatedReviewQuery,
  useReviewDetailQuery,
} from "@/features/review/queries";
import { Review } from "@/features/review/types";
import { AdBanner } from "@/shared/components/ads/ad-banner";
import { Button } from "@/shared/components/shadcn/button";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";
import { PATHS } from "@/shared/constants/paths";

import { RecommendReviews } from "../recommend-reviews";
import { ReviewDetailActions } from "./actions";
import { ReviewDetailContent } from "./content";
import { ReviewDetailHeader } from "./header";
import { ReviewDetailSkeleton } from "./skeleton";

interface ReviewDetailProps {
  id: number;
  initialReview?: Review | null;
}

export const ReviewDetail = ({ id, initialReview }: ReviewDetailProps) => {
  const { user } = useAuthStore();

  // 1. 공개 리뷰 조회
  const {
    data: publicReview,
    isLoading: isPublicLoading,
    error: publicError,
  } = useReviewDetailQuery(id, true, initialReview ?? undefined);

  // 2. 비공개 리뷰 자동 조회 조건 (403 에러 && 로그인 상태)
  const isPrivateError = (publicError as AxiosError)?.response?.status === 403;
  const shouldFetchPrivate = isPrivateError && !!user;

  // 3. 인증된 리뷰 조회 (조건부 실행)
  const { data: authenticatedReview, isLoading: isAuthLoading } =
    useAuthenticatedReviewQuery(id, shouldFetchPrivate);

  // 4. 최종 데이터 및 로딩 상태 결정
  const finalReview = publicReview || authenticatedReview;

  // 로딩 상태: 공개 로딩 중 OR (비공개 조회 조건 만족 시 데이터 도착 전까지 로딩 유지)
  // shouldFetchPrivate가 true가 되는 순간(=403확인 직후)부터 데이터가 올 때까지 로딩을 유지해야 플리커링 방지됨
  const isLoading =
    isPublicLoading ||
    (shouldFetchPrivate && (!authenticatedReview || isAuthLoading));

  if (isLoading) {
    return <ReviewDetailSkeleton />;
  }

  if (!finalReview) {
    return (
      <NotFoundRedirect
        message="존재하지 않거나 삭제된 리뷰입니다."
        fallbackPath={PATHS.REVIEWS}
      />
    );
  }

  const book = finalReview.book;
  const isAuthor = user?.id === finalReview.userId;

  return (
    <article className="min-h-screen bg-white pb-20">
      <ReviewDetailHeader review={finalReview} book={book} />

      <div className="container mx-auto px-4 max-w-4xl py-16">
        <ReviewDetailContent content={finalReview.content} />
        <ReviewDetailActions
          reviewId={String(id)}
          reactionCounts={finalReview.reactionCounts}
        />

        {/* 광고 배너 */}
        <AdBanner
          dataAdSlot="3367138518"
          dataAdFormat="horizontal"
          className="w-full my-8"
        />

        {/* 댓글 섹션 */}
        <CommentSection
          targetType={CommentTargetType.REVIEW}
          targetId={String(id)}
        />

        {/* 추천 리뷰 섹션 */}
        <RecommendReviews id={id} category={finalReview.category} />

        {/* 네비게이션 & 편집 버튼 */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-stone-100">
          <Button
            variant="ghost"
            className="text-stone-500 hover:text-stone-900"
            asChild
          >
            <Link href={PATHS.REVIEWS}>← Back to Reviews</Link>
          </Button>

          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              className="border-stone-200 hover:bg-stone-50"
              asChild
            >
              <Link href={PATHS.REVIEW_EDIT(String(id))}>
                <Edit className="w-4 h-4 mr-2" />
                리뷰 수정하기
              </Link>
            </Button>
          )}
        </div>
      </div>
      <ScrollTopButton />
    </article>
  );
};
