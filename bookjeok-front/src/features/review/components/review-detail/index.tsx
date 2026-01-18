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

  // 공개 리뷰 조회
  const {
    data: publicReview,
    isLoading: isPublicLoading,
    error: publicError,
  } = useReviewDetailQuery(id, true, initialReview ?? undefined);

  // 비공개 리뷰 접근(403) 시 로그인 상태라면 자동 인증 조회 시도
  const isPrivateError = (publicError as AxiosError)?.response?.status === 403;
  const shouldFetchPrivate = isPrivateError && !!user;

  const {
    data: authenticatedReview,
    isLoading: isAuthLoading,
    error: authError,
  } = useAuthenticatedReviewQuery(id, shouldFetchPrivate);

  const finalReview = publicReview || authenticatedReview;

  // 로딩 상태 처리:
  // 1. 공개/비공개 쿼리가 로딩 중이거나
  // 2. 비공개 조회를 해야 하는데 아직 데이터나 에러 결과가 없는 대기 상태일 때
  const isLoading =
    isPublicLoading ||
    isAuthLoading ||
    (shouldFetchPrivate && !authenticatedReview && !authError);

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
