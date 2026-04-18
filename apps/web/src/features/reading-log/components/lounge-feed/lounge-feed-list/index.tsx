"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useLoungeFeedInfiniteQuery } from "@/features/reading-log/queries";
import { Skeleton } from "@/shared/components/shadcn/skeleton";

import { LoungeBookDetailModal } from "../lounge-book-detail-modal";
import { LoungeEmptyState } from "../lounge-empty-state";
import { LoungeFeedCard } from "../lounge-feed-card";

export function LoungeFeedList() {
  const t = useTranslations("lounge.feed");
  const [selectedIsbn, setSelectedIsbn] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLoungeFeedInfiniteQuery();

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCardClick = (isbn: string) => {
    setSelectedIsbn(isbn);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 모달 닫힘 애니메이션을 위해 약간의 지연 후 ISBN 초기화
    setTimeout(() => setSelectedIsbn(null), 300);
  };

  if (isLoading) {
    return (
      <section>
        <div className="mb-10">
          <Skeleton className="h-8 w-48 mb-3" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-2xl border border-stone-100"
            >
              <Skeleton className="h-28 w-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3 py-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-6 w-32 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section>
        <div className="py-20 text-center">
          <p className="text-stone-400 text-sm">{t("error")}</p>
        </div>
      </section>
    );
  }

  const items = data?.pages.flatMap((page) => page.items) || [];

  if (items.length === 0) {
    return <LoungeEmptyState />;
  }

  return (
    <section>
      {/* 섹션 헤더: 기존 슬라이더 헤더 패턴 */}
      <div className="mb-10 border-b border-stone-200 pb-5">
        <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-medium tracking-tight">
          {t("title")}
        </h2>
      </div>

      {/* 피드 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.isbn}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(index * 0.05, 0.3),
                duration: 0.35,
              }}
            >
              <LoungeFeedCard item={item} onCardClick={handleCardClick} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 로딩 / 완료 인디케이터 */}
      <div ref={loaderRef} className="py-8 flex justify-center">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
            <span className="ml-1.5 font-light">{t("loading_more")}</span>
          </div>
        )}
        {!hasNextPage && items.length > 0 && (
          <p className="text-stone-300 text-xs font-light">{t("all_loaded")}</p>
        )}
      </div>

      {/* 상세 모달 */}
      <LoungeBookDetailModal
        isbn={selectedIsbn}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
}
