"use client";

import { CommentTargetType } from "@bookjeok/core";
import { useEffect, useState } from "react";

import { BookDetail } from "@/features/book/components/book-detail";
import { RelatedSales } from "@/features/book-sale/components/sale-detail/related-sales";
import { CommentSection } from "@/features/comment/components/common/comment-section";
import { RelatedReviews } from "@/features/review/components/review-detail/related-reviews";
import { Bubble } from "@/shared/components/canvasui/bubble";

export const BookDetailView = ({ isbn }: { isbn: string }) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine)");
    setIsDesktop(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const content = (
    <div className="flex flex-col w-full py-8 overflow-visible max-w-5xl mx-auto px-4 sm:px-6">
      <BookDetail isbn={isbn} />
      <RelatedSales isbn={isbn} />
      <CommentSection targetType={CommentTargetType.BOOK} targetId={isbn} />
      <RelatedReviews isbn={isbn} />
    </div>
  );

  if (!isDesktop) {
    return <div className="w-full overflow-visible">{content}</div>;
  }

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-visible">
      <Bubble className="w-full overflow-visible" contentStyle={{ overflow: "visible" }}>
        {content}
      </Bubble>
    </div>
  );
};
