"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { CommentSection } from "@/features/comment/components/comment-section";
import { CommentTargetType } from "@/features/comment/types";
import { getReviewAuthenticated } from "@/features/review/apis";
import { useReviewDetailQuery } from "@/features/review/queries";
import { Review } from "@/features/review/types";
import { AdBanner } from "@/shared/components/ads/ad-banner";
import { Button } from "@/shared/components/shadcn/button";
import { NotFoundRedirect } from "@/shared/components/ui/not-found-redirect";
import { ScrollTopButton } from "@/shared/components/ui/scroll-top-button";
import { PATHS } from "@/shared/constants/paths";
import { QUERY_KEYS } from "@/shared/constants/query-keys";

import { RecommendReviews } from "../recommend-reviews";
import { ReviewDetailActions } from "./actions";
import { ReviewDetailContent } from "./content";
import { ReviewDetailHeader } from "./header";
import { PrivateReviewOverlay } from "./private-overlay";
import { ReviewDetailSkeleton } from "./skeleton";

interface ReviewDetailProps {
  id: number;
  initialReview?: Review | null;
}

export const ReviewDetail = ({ id, initialReview }: ReviewDetailProps) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: review, isLoading } = useReviewDetailQuery(
    id,
    initialReview ?? undefined,
  );

  // 비공개 상태 판별 (review가 있을 때만)
  const isPrivateMasked = review ? !review.isPublic && !review.content : false;
  const isAuthor = review ? user?.id === review.userId : false;

  // 본인의 비공개 리뷰인데 마스킹 상태라면, 인증된 요청으로 원본 데이터를 가져옴
  useEffect(() => {
    if (isPrivateMasked && isAuthor) {
      getReviewAuthenticated(id).then((fullReview) => {
        queryClient.setQueryData(
          QUERY_KEYS.reviewKeys.detail(id).queryKey,
          fullReview,
        );
      });
    }
  }, [id, isPrivateMasked, isAuthor, queryClient]);

  // 로딩 중이거나, 본인 비공개 리뷰의 데이터를 가져오는 중이면 스켈레톤 표시
  if (isLoading || (isPrivateMasked && isAuthor)) {
    return <ReviewDetailSkeleton />;
  }

  if (!review) {
    return (
      <NotFoundRedirect
        message="존재하지 않거나 삭제된 리뷰입니다."
        fallbackPath={PATHS.REVIEWS}
      />
    );
  }

  const book = review.book;

  return (
    <article className="min-h-screen bg-white pb-20">
      <ReviewDetailHeader review={review} book={book} />

      <div className="container mx-auto px-4 max-w-4xl py-16">
        {isPrivateMasked ? (
          <PrivateReviewOverlay />
        ) : (
          <ReviewDetailContent content={review.content} />
        )}

        {/* 액션 버튼들 (공개 또는 본인일 때만 노출) */}
        {!isPrivateMasked && (
          <ReviewDetailActions
            reviewId={String(id)}
            reactionCounts={review.reactionCounts}
          />
        )}

        {/* 광고 배너 */}
        {/* <AdBanner
          dataAdSlot="3367138518"
          dataAdFormat="horizontal"
          className="w-full my-8"
        /> */}

        {/* 댓글 섹션 */}
        <CommentSection
          targetType={CommentTargetType.REVIEW}
          targetId={String(id)}
        />

        {/* 추천 리뷰 섹션 */}
        <RecommendReviews id={id} category={review.category} />

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
