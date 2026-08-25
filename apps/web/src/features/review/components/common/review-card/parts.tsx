"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ReactNode } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { cn } from "@/shared/utils/cn";
import { formatDate } from "@/shared/utils/format-date";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

import { useReviewCardContext } from "./context";

export const ImageArea = ({ className }: { className?: string }) => {
  const t = useTranslations("common");
  const { review, priority } = useReviewCardContext();
  const book = review.book;

  return (
    <div
      className={cn(
        "relative w-[120px] shrink-0 overflow-hidden bg-stone-100",
        className,
      )}
    >
      {book?.image ? (
        <Image
          src={book.image}
          alt={book.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="120px"
          priority={priority}
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center text-stone-300 text-xs font-light">
          No Image
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      
      {/* 비공개 표시 */}
      {!review.isPublic && (
        <div className="absolute top-2 left-2 text-[9px] text-white/90 bg-black/50 px-1.5 py-0.5">
          {t("status.private")}
        </div>
      )}
    </div>
  );
};

export const Content = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex-1 flex flex-col p-3 min-w-0", className)}>
      {children}
    </div>
  );
};

export const Meta = ({ className }: { className?: string }) => {
  const { review } = useReviewCardContext();
  const locale = useLocale();
  const book = review.book;

  return (
    <div className={cn("flex items-center gap-2 mb-1.5", className)}>
      <span className="text-[11px] text-stone-400 font-light truncate">
        {book?.author || "Unknown"}
      </span>
      <span className="w-0.5 h-0.5 rounded-full bg-stone-300 shrink-0" />
      <span className="text-[11px] text-stone-300 font-light">
        {formatDate(review.createdAt, locale, "short")}
      </span>
      {review.rating > 0 && (
        <>
          <span className="w-0.5 h-0.5 rounded-full bg-stone-300 shrink-0" />
          <div className="flex items-center gap-0.5">
            <span className="text-amber-400 text-[10px]">★</span>
            <span className="text-[10px] text-stone-400">
              {review.rating.toFixed(1)}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export const Title = ({ className }: { className?: string }) => {
  const { review } = useReviewCardContext();

  return (
    <h3
      className={cn(
        "text-sm font-semibold text-stone-700 mb-2 leading-snug group-hover:text-stone-500 transition-colors duration-200 line-clamp-2",
        className,
      )}
    >
      {review.title}
    </h3>
  );
};

export const Tags = ({ className }: { className?: string }) => {
  const { review } = useReviewCardContext();

  if (!review.tags || review.tags.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-nowrap items-center gap-1.5 mb-2 overflow-hidden",
        className,
      )}
    >
      {review.tags.slice(0, 3).map((tag: string) => (
        <span
          key={tag}
          className="text-[10px] text-stone-400 whitespace-nowrap shrink-0"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
};

interface ActionProps {
  className?: string;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  hideUser?: boolean;
}

export const Action = ({
  className,
  onEdit,
  onDelete,
  hideUser = false,
}: ActionProps) => {
  const t = useTranslations("common");
  const { review } = useReviewCardContext();

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(review.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(review.id);
  };

  return (
    <div
      className={cn(
        "mt-auto pt-2 border-t border-stone-100 flex items-center gap-2 justify-between",
        className,
      )}
    >
      {!hideUser ? (
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5" data-nosnippet>
            <AvatarImage
              src={getProfileImageUrl(review.user?.profileImageUrl)}
              alt={review.user?.nickname}
            />
            <AvatarFallback className="bg-stone-100 text-[9px] font-medium text-stone-500">
              {review.user?.nickname?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-stone-500 font-light" data-nosnippet>
            {review.user?.nickname || "Anonymous"}
          </span>
        </div>
      ) : (
        <div />
      )}

      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors px-1 py-0.5"
            >
              {t("actions.edit")}
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="text-[10px] text-stone-400 hover:text-red-500 transition-colors px-1 py-0.5"
            >
              {t("actions.delete")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
