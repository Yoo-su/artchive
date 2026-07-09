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
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/shared/utils";

interface ReadingLogCardDeckProps {
  logs: ReadingLog[];
  currentDate?: Date;
  onShareClick?: () => void;
  isSharedPage?: boolean;
  readOnly?: boolean;
}

export function ReadingLogCardDeck({
  logs,
  currentDate = new Date(),
  onShareClick,
  isSharedPage = false,
  readOnly = false,
}: ReadingLogCardDeckProps) {
  const t = useTranslations("reading_log");
  const [activeIndex, setActiveIndex] = useState(0);
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);

  // 탑 카드의 드래그 인터랙션을 위한 Framer Motion 값
  const dragX = useMotionValue(0);
  const rotateX = useTransform(dragX, [-200, 200], [-30, 30]);
  const opacityX = useTransform(
    dragX,
    [-200, -120, 0, 120, 200],
    [0.5, 1, 1, 1, 0.5]
  );

  const handleCardClick = (id: string) => {
    // 가장 위에 있는 탑 카드만 뒤집을 수 있도록 처리
    const topCard = logs[activeIndex];
    if (topCard && topCard.id === id) {
      setFlippedCardId(flippedCardId === id ? null : id);
    }
  };

  const handleDragEnd = async (_event: any, info: any) => {
    const swipeThreshold = 120;
    if (info.offset.x < -swipeThreshold) {
      setFlippedCardId(null);
      dragX.set(-500);
      setTimeout(() => {
        setActiveIndex((prev) => prev + 1);
        dragX.set(0);
      }, 200);
    } else if (info.offset.x > swipeThreshold) {
      setFlippedCardId(null);
      dragX.set(500);
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
    const shareUrl = `${window.location.origin}/share/deck/my-reading?year=${currentDate.getFullYear()}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("링크가 복사되었습니다!");
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-stone-100 shadow-xl max-w-md mx-auto min-h-[350px]">
        <div className="p-4 bg-stone-50 rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-stone-300" />
        </div>
        <h3 className="text-xl font-serif font-semibold text-stone-850 mb-2">
          {t("list.empty")}
        </h3>
        <p className="text-sm text-stone-500 max-w-xs break-keep">
          {t("deck.empty_sub")}
        </p>
      </div>
    );
  }

  const isDeckFinished = activeIndex >= logs.length;

  const getFanStyles = (depth: number) => {
    if (depth === 0) {
      return {
        rotate: 0,
        x: 0,
        y: 0,
        scale: 1,
        zIndex: 50,
        filter: "brightness(1)",
      };
    }

    const rotations = [0, -6, 6, -12, 12];
    const xOffsets = [0, -28, 28, -55, 55];
    const yOffsets = [0, 4, 4, 12, 12];
    const scales = [1, 0.97, 0.97, 0.94, 0.94];
    const idx = Math.min(depth, 4);

    return {
      rotate: rotations[idx],
      x: xOffsets[idx],
      y: yOffsets[idx],
      scale: scales[idx],
      zIndex: 50 - depth * 10,
      filter: `brightness(${1 - Math.min(depth, 3) * 0.12})`,
    };
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 min-h-[560px] relative overflow-visible">
      {/* 공유 및 제어 바 영역 */}
      {!isDeckFinished && (
        <div className="absolute top-0 right-4 z-50 flex items-center gap-2">
          {!isSharedPage && !readOnly && (
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-xs font-semibold shadow-md hover:bg-stone-800 transition-colors hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              {t("deck.copy_link")}
            </button>
          )}
        </div>
      )}

      {/* 카드 스택 뷰포트 — 3D perspective 왜곡 효과는 개별 카드 플립 래퍼에 부여 */}
      <div className="relative w-full max-w-[340px] h-[480px] flex items-center justify-center mt-8">
        <AnimatePresence>
          {isDeckFinished ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full bg-white text-stone-900 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center border border-stone-100 relative overflow-hidden"
            >
              <p className="text-stone-500 text-sm mb-8 leading-relaxed max-w-[240px] break-keep">
                {t("deck.finished_message")}
              </p>

              <div className="w-full bg-stone-50 rounded-2xl p-5 border border-stone-100 mb-8">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-1">
                  {t("deck.total_count_label")}
                </p>
                <div className="text-4xl font-serif font-bold text-stone-900">
                  {logs.length} <span className="text-lg text-stone-500 font-sans">{t("stats.unit")}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="text-stone-500 hover:text-stone-700 text-xs font-semibold underline underline-offset-4 cursor-pointer transition-colors duration-200"
                >
                  {t("deck.reset_button")}
                </button>
              </div>
            </motion.div>
          ) : (
            logs.map((log, i) => {
              if (i < activeIndex) return null;
              const depth = i - activeIndex;
              if (depth > 4) return null;

              const isTop = depth === 0;
              const isFlipped = flippedCardId === log.id;
              const fanStyle = getFanStyles(depth);

              return (
                <motion.div
                  key={log.id}
                  style={
                    isTop
                      ? {
                          x: dragX,
                          rotate: rotateX,
                          opacity: opacityX,
                          zIndex: fanStyle.zIndex,
                        }
                      : { ...fanStyle }
                  }
                  drag={isTop && !isFlipped ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  animate={
                    isTop
                      ? { scale: 1, filter: "brightness(1)" }
                      : {
                          rotate: fanStyle.rotate,
                          x: fanStyle.x,
                          y: fanStyle.y,
                          scale: fanStyle.scale,
                          filter: fanStyle.filter,
                        }
                  }
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={cn(
                    "absolute w-full h-full select-none",
                    isTop ? "cursor-pointer" : "pointer-events-none"
                  )}
                >
                  {/* 3D 플립 래퍼 — 원근감(perspective)을 이 요소에 직접 부여 */}
                  <motion.div
                    onClick={() => handleCardClick(log.id)}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: 1200,
                      willChange: "transform",
                    }}
                    className="w-full h-full relative shadow-xl rounded-3xl cursor-pointer"
                  >
                    {/* ===== 카드 앞면 (도서 표지) ===== */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        willChange: "transform",
                      }}
                      className="absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200/80 p-3 flex flex-col justify-between shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)]"
                    >
                      <div className="relative w-full h-[90%] rounded-2xl overflow-hidden shadow-inner ring-1 ring-black/5 bg-stone-50">
                        {log.book.image ? (
                          <Image
                            src={log.book.image}
                            alt={log.book.title}
                            fill
                            priority={isTop}
                            unoptimized
                            className="object-cover pointer-events-none"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                            <BookOpen className="w-12 h-12 mb-2" />
                            <p className="text-xs">No Cover</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>

                      <div className="h-[10%] flex items-center justify-between px-2 pt-1">
                        <span className="text-[10px] font-mono tracking-wider text-stone-500 uppercase">
                          {format(new Date(log.date), "yyyy.MM.dd")}
                        </span>
                        <div className="p-1.5 bg-stone-100 rounded-full hover:bg-stone-200/80 transition-colors">
                          <RotateCw className="w-3.5 h-3.5 text-stone-500" />
                        </div>
                      </div>
                    </div>

                    {/* ===== 카드 뒷면 (독서 감상 메모) ===== */}
                    <div
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        willChange: "transform",
                      }}
                      className="absolute inset-0 w-full h-full rounded-3xl bg-white border border-stone-200 p-8 flex flex-col justify-between shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] overflow-hidden"
                    >
                      {/* 텍스트 선명도 확보를 위한 GPU 합성 레이어 강제 승격 */}
                      <div style={{ transform: "translateZ(1px)" }} className="flex flex-col justify-between h-full">
                        {/* 메모 헤더 */}
                        <div className="flex items-center justify-between border-b border-stone-200/60 pb-3 shrink-0">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-stone-700" />
                            <span className="text-xs font-serif font-semibold text-stone-850">
                              {t("deck.back_title")}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase">
                            {format(new Date(log.date), "yyyy.MM.dd")}
                          </span>
                        </div>

                        {/* 메모 본문 */}
                        <div className="flex-1 flex flex-col justify-center my-6 overflow-hidden">
                          <h4 className="text-base font-bold text-stone-900 font-serif line-clamp-2 leading-snug mb-1 break-keep">
                            {log.book.title}
                          </h4>
                          <p className="text-xs text-stone-500 font-medium mb-5 truncate break-keep">
                            {log.book.author}
                          </p>

                          <div className="relative p-4 bg-stone-50/50 rounded-2xl border border-stone-200/40 flex-1 flex flex-col justify-center min-h-0">
                            {log.memo ? (
                              <p className="text-stone-700 text-sm font-serif italic font-light leading-relaxed text-center overflow-y-auto max-h-full px-1 break-keep">
                                &ldquo;{log.memo}&rdquo;
                              </p>
                            ) : (
                              <p className="text-xs text-center italic font-light text-stone-500 break-keep">
                                {t("deck.empty_memo")}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 메모 푸터 */}
                        <div className="flex items-center justify-between border-t border-stone-200/60 pt-3 shrink-0">
                          <span className="text-[9px] font-mono tracking-widest text-stone-400">
                            BOOKJEOK
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-600">
                            <RotateCw className="w-3.5 h-3.5" />
                            {t("deck.flipped_hint")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* 좌우 드래그 스와이프 안내 힌트 */}
      {!isDeckFinished && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-stone-400 text-xs mt-6 flex items-center gap-2"
        >
          <span>{t("deck.swipe_hint")}</span>
        </motion.p>
      )}
    </div>
  );
}
