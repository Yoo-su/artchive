"use client";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

/**
 * 최신 리뷰 리스트 로딩 시 렌더링될 스켈레톤 컴포넌트
 */
export const RecentReviewListSkeleton = () => {
  return (
    <div className="flex flex-col border-t border-stone-200">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 sm:gap-6 py-5 border-b border-stone-100 px-2 sm:px-4"
        >
          {/* 책 표지 썸네일 스켈레톤 */}
          <Skeleton className="w-12 h-17 sm:w-14 sm:h-20 rounded-md shrink-0 bg-stone-100" />

          {/* 텍스트 영역 스켈레톤 */}
          <div className="flex-1 min-w-0">
            {/* 별점/책제목 라인 */}
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-3 w-10 bg-stone-100" />
              <Skeleton className="h-3 w-28 bg-stone-100" />
            </div>
            {/* 리뷰 제목 */}
            <Skeleton className="h-4.5 w-2/3 mb-2 bg-stone-100" />
            {/* 리뷰 본문 */}
            <Skeleton className="h-4 w-full mb-2 bg-stone-100" />
            {/* 태그 영역 */}
            <div className="flex gap-1.5">
              <Skeleton className="h-3.5 w-12 bg-stone-100" />
              <Skeleton className="h-3.5 w-8 bg-stone-100" />
              <Skeleton className="h-3.5 w-10 bg-stone-100" />
            </div>
          </div>

          {/* 유저 및 날짜 영역 스켈레톤 */}
          <div className="flex items-center gap-3 shrink-0 pl-2">
            <div className="flex flex-col items-end gap-1.5">
              <Skeleton className="h-3.5 w-12 bg-stone-100" />
              <Skeleton className="h-3 w-10 bg-stone-100" />
            </div>
            <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hidden sm:block bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
};
