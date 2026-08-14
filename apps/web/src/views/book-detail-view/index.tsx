"use client";

import { CommentTargetType } from "@bookjeok/core";

import { BookDetail } from "@/features/book/components/book-detail";
import { RelatedSales } from "@/features/book-sale/components/sale-detail/related-sales";
import { CommentSection } from "@/features/comment/components/common/comment-section";
import { RelatedReviews } from "@/features/review/components/review-detail/related-reviews";

export const BookDetailView = ({ isbn }: { isbn: string }) => {
  return (
    <div className="flex flex-col w-full py-8 max-w-5xl mx-auto px-4 sm:px-6">
      <BookDetail isbn={isbn} />
      <RelatedSales isbn={isbn} />
      <CommentSection targetType={CommentTargetType.BOOK} targetId={isbn} />
      <RelatedReviews isbn={isbn} />
    </div>
  );
};
