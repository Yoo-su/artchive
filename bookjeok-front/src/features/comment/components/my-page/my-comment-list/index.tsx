"use client";

import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  BookOpen,
  Heart,
  Loader2,
  MessageSquare,
  PenLine,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { useDeleteMyCommentMutation } from "@/features/comment/mutations";
import { useMyCommentsInfiniteQuery } from "@/features/comment/queries";
import { CommentTargetType } from "@/features/comment/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/shadcn/alert-dialog";
import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

/**
 * 타겟 타입에 따른 링크 생성
 */
const getTargetLink = (targetType: CommentTargetType, targetId: string) => {
  switch (targetType) {
    case CommentTargetType.BOOK:
      return PATHS.BOOK_DETAIL(targetId);
    case CommentTargetType.REVIEW:
      return PATHS.REVIEW_DETAIL(targetId);
    default:
      return "#";
  }
};

/**
 * 내가 쓴 댓글 목록 컴포넌트
 * - 무한 스크롤 지원
 * - 댓글 삭제 기능 포함
 */
export const MyCommentList = () => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMyCommentsInfiniteQuery();
  const { mutate: deleteComment, isPending: isDeleting } =
    useDeleteMyCommentMutation();

  const handleDelete = useCallback(
    (commentId: number) => {
      deleteComment(commentId);
    },
    [deleteComment],
  );

  if (isLoading) {
    return <MyCommentListSkeleton />;
  }

  const allComments = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">내가 쓴 댓글</h1>
          <p className="text-sm text-stone-500 mt-1">
            총 {total}개의 댓글을 작성했어요
          </p>
        </div>
      </div>

      {allComments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-stone-400">
            <MessageSquare className="w-16 h-16 mb-4 stroke-1" />
            <p className="text-lg font-medium">작성한 댓글이 없습니다</p>
            <p className="text-sm mt-1">도서나 리뷰에 댓글을 달아보세요!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allComments.map((comment) => (
            <Card
              key={comment.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-stone-100"
            >
              <CardContent className="p-0">
                {/* 상단: 대상 정보 */}
                <Link
                  href={getTargetLink(comment.targetType, comment.targetId)}
                  className="block px-5 py-3 bg-linear-to-r from-stone-50 to-transparent hover:from-stone-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        comment.targetType === CommentTargetType.REVIEW
                          ? "bg-blue-100"
                          : "bg-emerald-100",
                      )}
                    >
                      {comment.targetType === CommentTargetType.REVIEW ? (
                        <PenLine className="w-4 h-4 text-blue-600" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {comment.targetTitle || "제목 없음"}
                      </p>
                      {comment.targetSubtitle && (
                        <p className="text-xs text-stone-500 truncate">
                          📖 {comment.targetSubtitle}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-stone-400 shrink-0">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                </Link>

                {/* 하단: 댓글 내용 */}
                <div className="px-5 py-4 flex items-start gap-4">
                  <p className="flex-1 text-stone-700 text-sm leading-relaxed line-clamp-3">
                    {comment.content}
                  </p>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* 좋아요 */}
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        comment.likeCount > 0
                          ? "text-rose-500"
                          : "text-stone-300",
                      )}
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          comment.likeCount > 0 && "fill-current",
                        )}
                      />
                      <span>{comment.likeCount}</span>
                    </div>

                    {/* 삭제 버튼 */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-stone-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 댓글을 삭제하시겠습니까?
                            <br />
                            삭제된 댓글은 복구할 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(comment.id)}
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* 더 보기 버튼 */}
          {hasNextPage && (
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-8"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    로딩 중...
                  </>
                ) : (
                  "더 보기"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

/**
 * 스켈레톤 컴포넌트
 */
export const MyCommentListSkeleton = () => (
  <>
    <Skeleton className="h-8 w-40 mb-2" />
    <Skeleton className="h-4 w-48 mb-8" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-0">
            <div className="px-5 py-3 bg-stone-50">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </>
);
