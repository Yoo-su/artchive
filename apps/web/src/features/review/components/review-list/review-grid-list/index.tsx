"use client";

import { MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useReviewsInfiniteQuery } from "@/features/review/queries";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewCard } from "../../common/review-card";
import { ReviewCardSkeleton } from "../../common/review-card/skeleton";
import { ReviewGridListSkeleton } from "./skeleton";

interface ReviewGridListProps {
  searchQuery: string;
  category: string | null;
  clearFilters: () => void;
  onDeleteReview?: (id: number) => void;
  onEditReview?: (id: number) => void;
  userId?: number;
}

export function ReviewGridList({
  searchQuery,
  category,
  clearFilters,
  onDeleteReview,
  onEditReview,
  userId,
}: ReviewGridListProps) {
  // 데이터 조회
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReviewsInfiniteQuery({
    limit: 12,
    category,
    search: searchQuery,
    userId,
  });

  const t = useTranslations("review.list");
  const tCommon = useTranslations("common");

  // Intersection Observer로 무한 스크롤 트리거 감지
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // 스크롤이 하단에 도달하고 다음 페이지가 있으면 추가 데이터 로드
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 로딩 상태
  if (isLoading) {
    return <ReviewGridListSkeleton />;
  }

  // 에러 발생 시
  if (isError) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-red-500">
        <p className="mb-4">{t("error")}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {tCommon("actions.retry")}
        </Button>
      </div>
    );
  }

  const reviews = data?.pages.flatMap((page) => page.reviews) || [];

  // 결과 없음
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6">
          <MessageSquare className="w-8 h-8 text-stone-400" />
        </div>
        <h3 className="text-2xl font-serif font-bold text-stone-800 mb-3">
          {searchQuery || category
            ? t("empty_search_title")
            : t("empty_list_title")}
        </h3>
        <p className="text-stone-500 mb-8 max-w-md mx-auto">
          {searchQuery || category
            ? t("empty_search_desc")
            : t("empty_list_desc")}
        </p>
        {searchQuery || category ? (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="border-stone-300 hover:bg-stone-50"
          >
            {t("view_all")}
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="border-stone-300 hover:bg-stone-50"
          >
            <Link href={PATHS.REVIEW_WRITE}>{t("write_first")}</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {reviews.map((review, index) => (
          <li key={review.id}>
            <ReviewCard.Root
              review={review}
              priority={index < 4}
            >
              <ReviewCard.Image />
              <ReviewCard.Content>
                <ReviewCard.Meta />
                <ReviewCard.Title />
                <ReviewCard.Tags />
                <ReviewCard.Action onEdit={onEditReview} onDelete={onDeleteReview} />
              </ReviewCard.Content>
            </ReviewCard.Root>
          </li>
        ))}
        {isFetchingNextPage && (
          <>
            <li><ReviewCardSkeleton /></li>
            <li><ReviewCardSkeleton /></li>
          </>
        )}
      </ul>

      {/* Infinite Scroll Trigger */}
      <div ref={ref} className="h-10 invisible" />
    </div>
  );
}
