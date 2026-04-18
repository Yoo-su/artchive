"use client";

import type { LoungeBookCard } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { LoungeBookDetailModal } from "@/features/reading-log/components/lounge-feed/lounge-book-detail-modal";
import { LoungeFeedList } from "@/features/reading-log/components/lounge-feed/lounge-feed-list";
import { LoungePopularBanner } from "@/features/reading-log/components/lounge-feed/lounge-popular-banner";

export function LoungeView() {
  const t = useTranslations("lounge");

  const [modalData, setModalData] = useState<{
    isbn: string;
    book?: LoungeBookCard["book"];
    totalCount?: number;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = (
    isbn: string,
    book?: LoungeBookCard["book"],
    totalCount?: number,
  ) => {
    setModalData({ isbn, book, totalCount });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalData(null), 300);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
        {/* 히어로 섹션: 기존 서비스 헤더 스타일과 통일 */}
        <div className="mb-16 md:mb-20 border-b border-stone-200 pb-6">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 font-medium tracking-tight leading-tight">
            {t("hero.title")}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-stone-500 font-light max-w-xl leading-relaxed whitespace-pre-line">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="space-y-20 md:space-y-28">
          {/* 인기 도서 배너 */}
          <LoungePopularBanner onCardClick={handleOpenModal} />

          {/* 최신 활동 피드 */}
          <LoungeFeedList onCardClick={handleOpenModal} />
        </div>
      </div>

      {/* 뷰 레벨 공통 상세 모달 */}
      <LoungeBookDetailModal
        isbn={modalData?.isbn || null}
        initialBook={modalData?.book || null}
        initialTotalCount={modalData?.totalCount || 0}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
