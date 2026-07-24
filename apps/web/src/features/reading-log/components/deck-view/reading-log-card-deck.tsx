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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // logs가 바뀌거나(월/연도 변경 등) 하면 첫 카드로 복귀
  useEffect(() => {
    setActiveIndex(0);
    setFlippedCardId(null);
  }, [logs]);

  // 탑 카드의 드래그 인터랙션을 위한 Framer Motion 값
  const dragX = useMotionValue(0);
  const rotateX = useTransform(dragX, [-200, 200], [-30, 30]);
  const opacityX = useTransform(
    dragX,
    [-200, -120, 0, 120, 200],
    [0.5, 1, 1, 1, 0.5]
  );

  const handleCardClick = (id: string | number) => {
    // 가장 위에 있는 탑 카드만 뒤집을 수 있도록 처리
    const topCard = logs[activeIndex];
    if (topCard && topCard.id === id) {
      setFlippedCardId(flippedCardId === id ? null : id);
    }
  };

  const handleDragEnd = async (_event: any, info: any) => {
    const swipeThreshold = 120;
    if (info.offset.x < -swipeThreshold || info.offset.x > swipeThreshold) {
      setFlippedCardId(null);
      dragX.set(info.offset.x < 0 ? -500 : 500);
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
        <div className="p-4 bg-stone-50 rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-stone-300" />
        </div>
        <h3 className="text-xl font-serif font-semibold text-stone-850 mb-2">
          {t("list.empty")}
        </h3>
        <p className="text-stone-400 text-xs font-light max-w-xs leading-relaxed">
          {t("deck.empty_sub")}
        </p>
      </div>
    );
  }

  const isDeckFinished = activeIndex >= logs.length;
  const remainingLogs = logs.slice(activeIndex);

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 min-h-[420px] sm:min-h-[560px] relative overflow-visible">
      {/* 카드 스택 메인 뷰포트 영역 */}
      <div className="relative w-full max-w-[250px] sm:max-w-[340px] h-[350px] sm:h-[480px] flex items-center justify-center">
        {isDeckFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 bg-white/90 backdrop-blur-md rounded-3xl border border-stone-200 shadow-2xl w-full h-full"
          >
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <RotateCw className="w-8 h-8 text-stone-600" />
            </div>
            <h4 className="text-base font-bold text-stone-800 mb-2">
              {t("deck.finished_message")}
            </h4>
            <p className="text-xs text-stone-500 mb-6">
              {t("deck.total_count_label")}: {logs.length}권
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-stone-900 text-white rounded-full text-xs font-semibold hover:bg-stone-800 transition-colors shadow-md active:scale-95 duration-200 cursor-pointer"
            >
              {t("deck.reset_button")}
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            {remainingLogs.slice(0, 3).map((log, index) => {
              const isTop = index === 0;
              const isFlipped = flippedCardId === log.id;

              // 팬 아웃 스택 스타일 계산 (뒤쪽 카드가 비스듬히 살짝 보이도록 설정)
              const fanStyle = {
                rotate: isMobile ? index * 4 : index * 6,
                x: isMobile ? index * 8 : index * 12,
                y: isMobile ? index * 4 : index * 6,
                scale: 1 - index * 0.04,
                filter: `brightness(${1 - index * 0.15})`,
              };

              return (
                <motion.div
                  key={log.id}
                  style={
                    isTop
                      ? {
                          x: dragX,
                          rotate: rotateX,
                          opacity: opacityX,
                          zIndex: 30,
                        }
                      : {
                          zIndex: 30 - index,
                        }
                  }
                  drag={isTop && !isFlipped ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.8}
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
            })}
          </AnimatePresence>
        )}
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

      {/* 조용한 공유 링크 복사 버튼 (카드 스택 밑 힌트 텍스트보다 아래에 배치) */}
      {!isDeckFinished && !isSharedPage && !readOnly && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-400 hover:text-stone-700 transition-colors active:scale-95 duration-200 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            {t("deck.copy_link")}
          </button>
        </div>
      )}
    </div>
  );
}
