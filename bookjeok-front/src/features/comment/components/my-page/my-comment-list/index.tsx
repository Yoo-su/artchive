"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import {
  BookOpen,
  Heart,
  Loader2,
  MessageSquare,
  PenLine,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Link, usePathname } from "@/shared/config/i18n/routing";
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
  const t = useTranslations("my_comments");
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? enUS : ko;
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {t("count_desc", { count: total })}
          </p>
        </div>
      </div>

      {allComments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-stone-400">
            <MessageSquare className="mb-4 h-16 w-16 stroke-1" />
            <p className="text-lg font-medium">{t("empty.title")}</p>
            <p className="mt-1 text-sm">{t("empty.desc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {allComments.map((comment) => (
            <Card
              key={comment.id}
              className="group overflow-hidden border-stone-100 transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="p-0">
                {/* 상단: 대상 정보 */}
                <Link
                  href={getTargetLink(comment.targetType, comment.targetId)}
                  className="block bg-linear-to-r from-stone-50 to-transparent px-5 py-3 transition-colors hover:from-stone-100"
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
                        <PenLine className="h-4 w-4 text-blue-600" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-800">
                        {comment.targetTitle || t("no_title")}
                      </p>
                      {comment.targetSubtitle && (
                        <p className="truncate text-xs text-stone-500">
                          📖 {comment.targetSubtitle}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-stone-400">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale,
                      })}
                    </span>
                  </div>
                </Link>

                {/* 하단: 댓글 내용 */}
                <div className="flex items-start gap-4 px-5 py-4">
                  <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-stone-700">
                    {comment.content}
                  </p>

                  <div className="flex shrink-0 items-center gap-3">
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
                          className="h-8 w-8 text-stone-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("delete_modal.title")}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="whitespace-pre-line">
                            {t("delete_modal.desc")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("delete_modal.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(comment.id)}
                          >
                            {t("delete_modal.confirm")}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  t("load_more")
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
    <Skeleton className="mb-2 h-8 w-40" />
    <Skeleton className="mb-8 h-4 w-48" />
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-0">
            <div className="bg-stone-50 px-5 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="mb-1 h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </>
);
