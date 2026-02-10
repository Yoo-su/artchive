"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS, ko } from "date-fns/locale";
import { Heart, Loader2, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { UserAvatarMenu } from "@/shared/components/ui/user-avatar-menu";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { cn } from "@/shared/utils";

import { COMMENT_LINE_CLAMP, MAX_COMMENT_LENGTH } from "../../../constants";
import {
  useDeleteCommentMutation,
  useToggleCommentLikeMutation,
  useUpdateCommentMutation,
} from "../../../mutations";
import { Comment, CommentTargetType } from "../../../types";

interface CommentItemProps {
  comment: Comment;
  targetType: CommentTargetType;
  targetId: string;
  page: number;
}

/**
 * 개별 댓글 카드 - 구름 스타일
 * 부드럽고 가벼운 느낌의 미니멀한 디자인
 */
export const CommentItem = ({
  comment,
  targetType,
  targetId,
  page,
}: CommentItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const t = useTranslations("comment.item");
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? enUS : ko;

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  const isOwner = user?.id === comment.userId;

  const { mutate: toggleLike, isPending: isLikePending } =
    useToggleCommentLikeMutation(targetType, targetId, page);
  const { mutate: updateComment, isPending: isUpdatePending } =
    useUpdateCommentMutation(targetType, targetId, page);
  const { mutate: deleteComment, isPending: isDeletePending } =
    useDeleteCommentMutation(targetType, targetId, page);

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale,
  });

  const isLongComment =
    comment.content.split("\n").length > COMMENT_LINE_CLAMP ||
    comment.content.length > 150;

  const handleLike = () => {
    if (!isAuthenticated || isLikePending) return;
    toggleLike(comment.id);
  };

  const handleUpdate = () => {
    if (!editContent.trim() || isUpdatePending) return;
    updateComment(
      { id: comment.id, content: editContent.trim() },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  return (
    <div className="flex gap-3 group">
      {/* 아바타 */}
      <UserAvatarMenu
        user={comment.user}
        showNickname={false}
        size="md"
        menuSide="right"
        menuAlign="center"
        className={cn(
          "shrink-0",
          isOwner && "ring-2 ring-sky-200 rounded-full",
        )}
      />

      {/* 말풍선 */}
      <div className="flex-1 min-w-0">
        {/* 구름 스타일 말풍선 */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl rounded-tl-sm",
            "shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
            "backdrop-blur-sm",
            "transition-all duration-200",
            "hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
            "bg-linear-to-br from-white/80 to-white/60 dark:from-white/10 dark:to-white/5",
          )}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-medium text-sm truncate">
                {comment.user.nickname}
              </span>
              {isOwner && (
                <span className="shrink-0 text-[10px] text-primary/70 font-medium">
                  · {t("me")}
                </span>
              )}
              <span className="shrink-0 text-[11px] text-muted-foreground/60">
                · {timeAgo}
              </span>
            </div>

            {/* 드롭다운 메뉴 */}
            {isOwner && !isEditing && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    >
                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[100px]">
                    <DropdownMenuItem
                      onClick={() => setIsEditing(true)}
                      disabled={isDeletePending}
                      className="text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1.5" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        disabled={isDeletePending}
                        onSelect={(e) => e.preventDefault()}
                        className="text-xs text-destructive focus:text-destructive"
                      >
                        {isDeletePending ? (
                          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 mr-1.5" />
                        )}
                        {t("delete")}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t("delete_confirm.title")}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("delete_confirm.desc")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteComment(comment.id)}
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* 본문 */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                className="min-h-[60px] resize-none text-sm bg-background/50"
              />
              <div className="flex gap-1.5 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleUpdate}
                  disabled={!editContent.trim() || isUpdatePending}
                >
                  {isUpdatePending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    t("save")
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-[13px] leading-relaxed text-foreground/85 whitespace-pre-wrap break-all",
                !isExpanded && isLongComment && "line-clamp-3",
              )}
            >
              {comment.content}
            </p>
          )}

          {/* 더 보기 버튼 */}
          {!isEditing && isLongComment && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] text-primary/70 hover:text-primary transition-colors mt-1"
            >
              {isExpanded ? t("fold") : t("more")}
            </button>
          )}
        </div>

        {/* 액션 바 (말풍선 외부) */}
        {!isEditing && (
          <div className="flex items-center gap-3 mt-1.5 ml-1">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || isLikePending}
              className={cn(
                "flex items-center gap-1 text-[11px] transition-all",
                comment.isLiked
                  ? "text-rose-500"
                  : "text-muted-foreground/50 hover:text-rose-400",
                !isAuthenticated && "cursor-not-allowed",
              )}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  comment.isLiked && "fill-current scale-110",
                )}
              />
              {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
