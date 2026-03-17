"use client";

import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
}

/**
 * 공통 페이지네이션 컴포넌트
 * 최대 maxVisiblePages개의 페이지 번호를 표시하고, 앞뒤 생략 기호를 자동 처리합니다.
 */
export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className,
}: PaginationProps) => {
  // 표시할 페이지 번호 계산
  const getPageNumbers = () => {
    const pages: number[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - halfVisible);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    // 시작 위치 재조정 (끝에 가까울 때)
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // 페이지가 1개 이하면 표시하지 않음
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {/* 이전 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3"
      >
        ←
      </Button>

      {/* 첫 페이지 + 생략 기호 */}
      {pageNumbers[0] > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            className="px-3"
          >
            1
          </Button>
          {pageNumbers[0] > 2 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
        </>
      )}

      {/* 페이지 번호들 */}
      {pageNumbers.map((num) => (
        <Button
          key={num}
          variant={num === currentPage ? "default" : "ghost"}
          size="sm"
          onClick={() => onPageChange(num)}
          className="px-3"
        >
          {num}
        </Button>
      ))}

      {/* 마지막 페이지 + 생략 기호 */}
      {pageNumbers[pageNumbers.length - 1] < totalPages && (
        <>
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="px-3"
          >
            {totalPages}
          </Button>
        </>
      )}

      {/* 다음 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3"
      >
        →
      </Button>
    </div>
  );
};
