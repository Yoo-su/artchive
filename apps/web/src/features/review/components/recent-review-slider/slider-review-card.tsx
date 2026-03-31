"use client";

import { Review } from "@bookjeok/core";
import { format } from "date-fns";
import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface SliderReviewCardProps {
  review: Review;
}

/**
 * 메인페이지 최신 리뷰 슬라이더에서 사용되는 카드 컴포넌트
 * 책 표지와 리뷰 정보를 매거진 스타일로 배치
 */
export const SliderReviewCard = ({ review }: SliderReviewCardProps) => {
  const tCommon = useTranslations("common");
  const book = review.book;

  return (
    <Link
      href={PATHS.REVIEW_DETAIL(review.id)}
      className="group block w-full h-full"
    >
      <div className="relative w-[260px] h-[340px] overflow-hidden bg-white border border-stone-100 transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5">
        {/* 상단 책 이미지 영역 */}
        <div className="relative h-[130px] bg-stone-50 flex items-center justify-center">
          <div className="relative w-[72px] h-[104px] overflow-hidden shadow-sm transition-transform duration-500 group-hover:scale-105">
            {book?.image ? (
              <Image
                src={book.image}
                alt={book.title}
                fill
                sizes="72px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-stone-100 text-stone-300 text-xs font-light">
                No Image
              </div>
            )}
          </div>

          {/* 별점 */}
          {review.rating > 0 && (
            <div className="absolute top-2.5 right-3 flex items-center gap-0.5">
              <span className="text-amber-400 text-[11px]">★</span>
              <span className="text-[11px] font-medium text-stone-500">
                {review.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* 하단 콘텐츠 영역 */}
        <div className="px-4 pt-3.5 pb-4 flex flex-col h-[210px]">
          {/* 리뷰 제목 */}
          <h3 className="text-[13px] font-semibold text-stone-800 leading-snug line-clamp-2 mb-1.5 group-hover:text-stone-500 transition-colors duration-200">
            {review.title}
          </h3>

          {/* 책 제목 & 저자 */}
          <p className="text-[11px] text-stone-400 truncate font-light">
            {book?.title || tCommon("unknown")}
          </p>
          <p className="text-[10px] text-stone-300 truncate font-light mb-auto">
            {book?.author || ""}
          </p>

          {/* 태그 */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex gap-1.5 overflow-hidden mb-3">
              {review.tags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] text-stone-400 whitespace-nowrap shrink-0"
                >
                  #{tag}
                </span>
              ))}
              {review.tags.length > 3 && (
                <span className="text-[10px] text-stone-300 shrink-0">
                  +{review.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 구분선 */}
          <div className="h-px bg-stone-100" />

          {/* 작성자 정보 */}
          <div className="flex items-center justify-between pt-2.5">
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
              <span className="text-[11px] text-stone-500 truncate max-w-[100px] font-light">
                {review.user?.nickname || tCommon("anonymous")}
              </span>
            </div>
            <span className="text-[10px] text-stone-300 font-light">
              {format(new Date(review.createdAt), "MM.dd")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
