"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import { Spinner } from "@/shared/components/shadcn/spinner";
import { Textarea } from "@/shared/components/shadcn/textarea";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { MAX_COMMENT_LENGTH } from "../../../constants/config";
import { useCreateCommentMutation } from "../../../mutations";
import { CommentTargetType } from "../../../types";

interface CommentFormProps {
  targetType: CommentTargetType;
  targetId: string;
}

/**
 * 댓글 작성 폼
 */
export const CommentForm = ({ targetType, targetId }: CommentFormProps) => {
  const [content, setContent] = useState("");
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  const { mutate: createComment, isPending } = useCreateCommentMutation(
    targetType,
    targetId,
  );
  const t = useTranslations("comment.form");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    createComment(content.trim(), {
      onSuccess: () => setContent(""),
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-muted/30 rounded-xl p-6 text-center mb-8">
        <p className="text-muted-foreground">
          {t.rich("login_guide", {
            link: (chunks) => (
              <Link
                href={PATHS.LOGIN}
                className="text-primary underline hover:no-underline"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          {/* 사용자 아바타 */}
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage
              src={getProfileImageUrl(user?.profileImageUrl)}
              alt={user?.nickname}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.nickname?.slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          {/* 입력 영역 */}
          <div className="flex-1 space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("placeholder")}
              maxLength={MAX_COMMENT_LENGTH}
              className={cn(
                "min-h-[80px] resize-none bg-background/50",
                "border-border/50 focus:border-primary/50",
                "placeholder:text-muted-foreground/50",
              )}
            />

            {/* 하단 액션 바 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {t("length_limit", {
                  current: content.length,
                  max: MAX_COMMENT_LENGTH,
                })}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || isPending}
                className="min-w-[60px]"
              >
                {isPending ? <Spinner /> : t("submit")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
