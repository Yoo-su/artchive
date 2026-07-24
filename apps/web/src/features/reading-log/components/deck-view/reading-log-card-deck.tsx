"use client";

import { ReadingLog } from "@bookjeok/core";
import { format } from "date-fns";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { BookOpen, RotateCw, Share2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { cn } from "@/shared/utils";

interface ReadingLogCardDeckProps {
  logs: ReadingLog[];
  currentDate?: Date;
  onShareClick?: () => void;
  isSharedPage?: boolean;
  readOnly?: boolean;
  isLoading?: boolean;
}

export function ReadingLogCardDeck({
  logs,
  currentDate = new Date(),
  onShareClick,
  isSharedPage = false,
  readOnly = false,
  isLoading = false,
}: ReadingLogCardDeckProps) {
  const t = useTranslations("reading_log");
  const { user } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedCardId, setFlippedCardId] = useState<string | number | null>(null);

  // 드래그 상태 제어
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 200], [-15, 15]);

  // logs가 바뀌거나(월 변경 등) 하면 첫 카드로 복귀
  useEffect(() => {
    setActiveIndex(0);
    setFlippedCardId(null);
    dragX.set(0);
  }, [logs, dragX]);

  const handleCardClick = (id: string | number) => {
    // 덱의 가장 상단 카드만 뒤집기 가능
    if (activeIndex !== 0) return;
    setFlippedCardId((prev) => (prev === id ? null : id));
  };

  const handleDragEnd = (_: any, info: any) => {
    // 상단 카드가 아닐 때 드래그 무시
    if (activeIndex !== 0) return;

    const threshold = 80;
    if (Math.abs(info.offset.x) > threshold) {
      // 카드가 옆으로 스와이프되어 맨 뒤로 이동
      setFlippedCardId(null);
      setTimeout(() => {
        setActiveIndex((prev) => prev + 1);
        dragX.set(0);
      }, 200);
    }
  };

  const handleReset = () => {
    setActiveIndex(0);
    setFlippedCardId(null);
    dragX.set(0);
  };

  const copyShareLink = () => {
    if (onShareClick) {
      onShareClick();
      return;
    }
    const userHandle = user?.handle || user?.nickname || user?.id;
    if (!userHandle) {
      toast.error("로그인 후 공유 기능을 이용하실 수 있습니다.");
      return;
    }
    const shareUrl = `${window.location.origin}/share/deck/${encodeURIComponent(userHandle)}?year=${currentDate.getFullYear()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("올해의 독서 덱 링크가 복사되었습니다!");
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-6 min-h-[420px] sm:min-h-[560px] relative overflow-visible">
        {/* 카드 실루엣 크기와 동일하게 애니메이션 스켈레톤 설계 */}
        <div className="relative w-full max-w-[250px] sm:max-w-[340px] h-[350px] sm:h-[480px] bg-stone-100 rounded-3xl border border-stone-200/50 flex flex-col items-center justify-center animate-pulse mt-8 shadow-md">
          <div className="w-10 h-10 border-4 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-stone-100 shadow-xl max-w-md mx-auto min-h-[350px]">
        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-400 mb-4 border border-stone-100">
          <BookOpen className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-base font-bold text-stone-800 font-serif mb-1">
          {isSharedPage ? t("deck.no_shared_logs") : t("deck.no_logs_title")}
        </h3>
        <p className="text-xs text-stone-500 max-w-xs leading-relaxed font-light break-keep">
          {isSharedPage ? t("deck.no_shared_logs_desc") : t("deck.no_logs_desc")}
        </p>
      </div>
    );
  }

  // activeIndex에 따라 덱을 순환(Re-order)
  const orderedLogs = logs.slice(activeIndex % logs.length).concat(logs.slice(0, activeIndex % logs.length));

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 min-h-[420px] sm:min-h-[560px] relative overflow-visible select-none">
      {/* 카드 덱 스택 영역 */}
      <div className="relative w-full max-w-[250px] sm:max-w-[340px] h-[350px] sm:h-[480px] flex items-center justify-center perspective-1000 mt-4 sm:mt-8">
        <AnimatePresence>
          {orderedLogs.slice(0, 3).map((log, index) => {
            const isTop = index === 0;
            const isFlipped = flippedCardId === log.id;

            // 스택 뒤에 쌓이는 카드들의 시각적 효과
            const scale = 1 - index * 0.05;
            const translateY = index * 12;
            const rotateZ = index === 1 ? 3 : index === 2 ? -4 : 0;
            const zIndex = 30 - index;

            return (
              <motion.div
                key={log.id}
                style={{
                  zIndex,
                  x: isTop ? dragX : 0,
                  rotate: isTop ? rotate : rotateZ,
                }}
                animate={{
                  scale,
                  y: translateY,
                  rotateZ: isTop ? 0 : rotateZ,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                drag={isTop && !isFlipped ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(log.id)}
                className={cn(
                  "absolute inset-0 rounded-3xl cursor-grab active:cursor-grabbing shadow-xl transition-all duration-300 transform-gpu overflow-hidden border border-stone-200/80 bg-white",
                  isFlipped && "[transform-style:preserve-3d]",
                )}
              >
                {/* ── [앞면 카드] ── */}
                <div
                  className={cn(
                    "w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-stone-900 text-white relative overflow-hidden transition-all duration-500",
                    isFlipped ? "opacity-0 pointer-events-none" : "opacity-100",
                  )}
                >
                  {/* 배경 책 표지 흐림 이미지 */}
                  {log.book.image && (
                    <div className="absolute inset-0 opacity-20 filter blur-xl scale-125 pointer-events-none">
                      <Image
                        src={log.book.image}
                        alt={log.book.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* 카드 상단 헤더 */}
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-[10px] sm:text-xs font-mono tracking-wider text-stone-400 uppercase">
                      {format(new Date(log.date), "yyyy.MM.dd")}
                    </span>
                    <span className="text-[10px] sm:text-xs font-serif text-amber-300/80 tracking-wide">
                      {t("deck.card_tag")}
                    </span>
                  </div>

                  {/* 카드 중앙 표지 및 서사 */}
                  <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
                    <div className="relative w-20 h-28 sm:w-28 sm:h-40 rounded-xl overflow-hidden shadow-2xl mb-4 border border-white/20">
                      {log.book.image ? (
                        <Image
                          src={log.book.image}
                          alt={log.book.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-800 flex items-center justify-center text-stone-500">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-bold font-serif text-white tracking-tight line-clamp-1 max-w-[90%]">
                      {log.book.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-stone-400 mt-1 font-light line-clamp-1">
                      {log.book.author}
                    </p>
                  </div>

                  {/* 카드 하단 풋터 안내 */}
                  <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] sm:text-xs text-stone-400">
                    <span className="font-light truncate max-w-[150px]">
                      {log.memo || t("deck.click_to_flip")}
                    </span>
                    <span className="flex items-center gap-1 text-amber-400/90 shrink-0 font-medium">
                      <RotateCw className="w-3 h-3" />
                      {t("deck.flip_hint")}
                    </span>
                  </div>
                </div>

                {/* ── [뒷면 카드: 감상문 & 별점] ── */}
                <div
                  className={cn(
                    "w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-stone-50 text-stone-900 absolute inset-0 transition-all duration-500 border border-stone-200/80 rounded-3xl",
                    isFlipped ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
                  )}
                >
                  {/* 뒷면 헤더 */}
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
                    <span className="text-xs font-serif font-bold text-stone-800">
                      {t("deck.review_title")}
                    </span>
                  </div>

                  {/* 뒷면 본문 감상평 */}
                  <div className="flex-1 overflow-y-auto py-3 space-y-2">
                    {log.memo ? (
                      <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-line">
                        {log.memo}
                      </p>
                    ) : (
                      <p className="text-xs text-stone-400 leading-relaxed italic font-light">
                        {t("deck.no_detailed_review")}
                      </p>
                    )}
                  </div>

                  {/* 뒷면 풋터 */}
                  <div className="flex items-center justify-between border-t border-stone-200/80 pt-3 text-[10px] sm:text-xs text-stone-400">
                    <span className="font-light">
                      {t("deck.completed_on", { date: format(new Date(log.date), "yyyy.MM.dd") })}
                    </span>
                    <span className="text-stone-500 flex items-center gap-1">
                      <RotateCw className="w-3 h-3 text-stone-400" />
                      {t("deck.back_to_front")}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 덱 하단 컨트롤러 바 */}
      <div className="mt-8 flex items-center justify-center gap-4 relative z-40">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 rounded-full text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{t("deck.reset_deck")}</span>
        </button>

        {!readOnly && (
          <button
            type="button"
            onClick={copyShareLink}
            className="px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 rounded-full text-xs font-medium shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t("deck.share_deck")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
