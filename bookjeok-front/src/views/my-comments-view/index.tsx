"use client";

import { MyCommentList } from "@/features/comment/components/my-comment-list";

/**
 * 내가 쓴 댓글 페이지 View
 */
export const MyCommentsView = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <MyCommentList />
    </div>
  );
};
