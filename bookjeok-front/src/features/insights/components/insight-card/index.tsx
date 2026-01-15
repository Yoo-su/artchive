"use client";

import { ReactNode } from "react";

// 말차색 팔레트
const MATCHA = {
  dark: "#4b6043",
  medium: "#658354",
};

interface InsightCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * 인사이트 카드 공통 래퍼 컴포넌트
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
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-3">
        {icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: MATCHA.medium }}
          >
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
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
