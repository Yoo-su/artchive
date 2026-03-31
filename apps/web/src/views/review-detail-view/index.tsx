"use client";

import { Review } from "@bookjeok/core";
import { useParams } from "next/navigation";

import { ReviewDetail } from "@/features/review/components/review-detail/book-review-detail";

interface ReviewDetailViewProps {
  initialReview?: Review | null;
}

export const ReviewDetailView = ({ initialReview }: ReviewDetailViewProps) => {
  const params = useParams();
  const id = Number(params.id);

  return <ReviewDetail id={id} initialReview={initialReview} />;
};
