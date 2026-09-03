"use client";

import { useParams } from "next/navigation";

import { ReviewDetail } from "@/features/review/components/review-detail/book-review-detail";
import { useReviewView } from "@/features/review/hooks/use-review-view";

export const ReviewDetailView = () => {
  const params = useParams();
  const id = Number(params.id);

  // 클라이언트 사이드에서 조회수 기록
  useReviewView(id);

  return <ReviewDetail id={id} />;
};
