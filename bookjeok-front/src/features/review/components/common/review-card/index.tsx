"use client";

import { format } from "date-fns";
import Image from "next/image";

import { Review } from "@/features/review/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface ReviewCardProps {
  review: Review;
  priority?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}

/**
 * 리뷰 정보를 카드 형태로 보여주는 컴포넌트입니다.
 * 수정 및 삭제 버튼을 포함할 수 있습니다.
 */
export function ReviewCard({
  review,
  priority = false,
  onDelete,
  onEdit,
}: ReviewCardProps) {
  const book = review.book;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(review.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(review.id);
  };

  return (
    <Link
      href={PATHS.REVIEW_DETAIL(review.id)}
      className="group block h-full relative"
    >
      <article className="flex h-[180px] bg-white overflow-hidden border border-stone-100 hover:shadow-md hover:border-stone-200 transition-all duration-300">
        {/* 이미지 컨테이너 (좌측) */}
        <div className="relative w-[120px] shrink-0 overflow-hidden bg-stone-100">
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
              비공개
            </div>
          )}
        </div>

        {/* 콘텐츠 (우측) */}
        <div className="flex-1 flex flex-col p-3 min-w-0">
          {/* 메타 정보 */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-stone-400 font-light truncate">
              {book?.author || "Unknown"}
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-stone-300 shrink-0" />
            <span className="text-[11px] text-stone-300 font-light">
              {format(new Date(review.createdAt), "yyyy.MM.dd")}
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

          {/* 리뷰 제목 */}
          <h3 className="text-sm font-semibold text-stone-700 mb-2 leading-snug group-hover:text-stone-500 transition-colors duration-200 line-clamp-2">
            {review.title}
          </h3>

          {/* 태그 */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-nowrap items-center gap-1.5 mb-auto overflow-hidden">
              {review.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] text-stone-400 whitespace-nowrap shrink-0"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 하단: 작성자 + 액션 */}
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center gap-2 justify-between">
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
              <span className="text-[11px] text-stone-500 line-clamp-1 font-light">
                {review.user?.nickname || "Anonymous"}
              </span>
            </div>

            {/* 수정/삭제 액션 */}
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors px-1 py-0.5"
                  >
                    수정
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="text-[10px] text-stone-400 hover:text-red-500 transition-colors px-1 py-0.5"
                  >
                    삭제
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
