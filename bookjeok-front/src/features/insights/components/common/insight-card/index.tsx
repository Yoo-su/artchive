"use client";

import { ReactNode } from "react";

// Stone/Mono 스타일 적용
interface InsightCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * 인사이트 카드 공통 래퍼 컴포넌트
 * - Flat, Minimal, Editorial Style
 */
export const InsightCard = ({
  title,
  description,
  icon,
  children,
  className = "",
}: InsightCardProps) => {
  return (
    <div
      className={`group rounded-xl border border-stone-200 bg-white p-6 transition-all duration-300 hover:border-stone-400 ${className}`}
    >
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {icon && <div className="text-stone-400">{icon}</div>}
          <h3 className="font-serif text-lg font-bold text-stone-800 tracking-tight">
            {title}
          </h3>
        </div>
        {description && (
          <p className="text-xs text-stone-500 font-medium tracking-wide uppercase ml-1">
            {description}
          </p>
        )}
      </div>

      {/* 콘텐츠 */}
      <div>{children}</div>
    </div>
  );
};

/**
 * 빈 데이터 상태 컴포넌트
 */
export const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="flex h-40 items-center justify-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
};
