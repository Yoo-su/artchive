"use client";

import type { LoungeBookCard } from "@bookjeok/core";
import { useState } from "react";

import { LoungeActiveReaders } from "@/features/reading-log/components/lounge-feed/lounge-active-readers";
import { LoungeBookDetailModal } from "@/features/reading-log/components/lounge-feed/lounge-book-detail-modal";
import { LoungeFeedList } from "@/features/reading-log/components/lounge-feed/lounge-feed-list";
import { LoungePopularBanner } from "@/features/reading-log/components/lounge-feed/lounge-popular-banner";
import { AdBanner } from "@/shared/components/ads/ad-banner";
import { CrowdCanvas } from "@/shared/components/skiperui/canvas-crowd";

export function LoungeView() {
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
    <div className="min-h-screen relative">
      {/* Skiper UI CrowdCanvas 히어로 영역 */}
      <div className="relative w-full h-[60vh] min-h-[400px] mb-8">
        <CrowdCanvas
          src="/images/peeps/all-peeps.png"
          rows={15}
          cols={7}
          className="absolute bottom-0 h-full w-full"
        />
      </div>

      <div className="w-full mx-auto px-4">
        {/* 광고 배너 */}
        <AdBanner
          dataAdSlot="6040704861"
          dataAdFormat="horizontal"
          className="w-full mb-12 md:mb-16"
        />

        {/* 콘텐츠 영역 */}
        <div className="space-y-20 md:space-y-28">
          {/* 열성 독서가 명예의 전당 */}
          <LoungeActiveReaders />

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
