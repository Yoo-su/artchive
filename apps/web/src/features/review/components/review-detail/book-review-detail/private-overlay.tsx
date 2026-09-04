"use client";

import { useTranslations } from "next-intl";

import { Lock } from "@/shared/components/icons/iconsax";

/**
 * 비공개 리뷰 안내 오버레이 컴포넌트
 * 접근 권한이 없는 사용자에게 보여지는 Glassmorphism 스타일의 UI
 */
export const PrivateReviewOverlay = () => {
  const t = useTranslations("review.private");

  return (
    <div className="relative w-full h-72 rounded-3xl overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] select-none ring-1 ring-stone-100/50">
      {/* 미묘한 패턴 배경 */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#000_1px,_transparent_0)] bg-[length:24px_24px]" />
      </div>

      {/* 콘텐츠 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
        {/* 플로팅 아이콘 카드 */}
        <div className="p-4 bg-stone-50 rounded-2xl shadow-sm mb-5 ring-1 ring-stone-100">
          <Lock className="w-6 h-6 text-stone-400" />
        </div>

        <h3 className="text-lg font-semibold text-stone-800 mb-1.5 tracking-tight">
          {t("title")}
        </h3>
        <p className="text-sm text-stone-400">
          {t("description")}
        </p>
      </div>
    </div>
  );
};
