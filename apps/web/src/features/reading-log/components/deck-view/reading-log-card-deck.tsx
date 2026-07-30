"use client";

import { ReadingLog } from "@bookjeok/core";
import { format } from "date-fns";
import { BookOpen, Quote, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  DraggableCardBody,
  DraggableCardContainer,
} from "@/shared/components/aceternityui/draggable-card";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      <div className="w-full flex flex-col items-center justify-center py-6 min-h-[480px] relative overflow-visible">
        <div className="relative w-[280px] sm:w-[320px] h-[480px] bg-white border border-stone-200 p-4 pb-8 flex flex-col items-center justify-center animate-pulse shadow-lg rounded-none">
          <div className="w-full h-64 bg-stone-200 mb-4" />
          <div className="w-3/4 h-4 bg-stone-200 mb-2" />
          <div className="w-1/2 h-3 bg-stone-200" />
        </div>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-stone-200 shadow-xl max-w-md mx-auto min-h-[360px]">
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

  // Polaroid photo scattered angles & positions
  const getPolaroidStyle = (index: number) => {
    const rotations = [-5, 4, -2, 6, -4, 5, -7, 3];
    const rotation = rotations[index % rotations.length];
    const offsetStep = isMobile ? 8 : 14;
    const topOffset = (index % 5) * offsetStep;
    const leftOffset = (index % 5) * (isMobile ? 5 : 10);

    return {
      transform: `rotate(${rotation}deg)`,
      top: `${topOffset}px`,
      left: `calc(50% - ${isMobile ? 140 : 160}px + ${leftOffset}px)`,
    };
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 relative overflow-visible select-none min-h-[580px] sm:min-h-[660px]">
      <DraggableCardContainer className="relative flex min-h-[540px] sm:min-h-[620px] w-full items-center justify-center overflow-visible p-4">
        {logs.map((log, index) => {
          const polaroidStyle = getPolaroidStyle(index);

          return (
            <DraggableCardBody
              key={log.id || index}
              style={polaroidStyle}
              className="absolute cursor-grab active:cursor-grabbing select-none w-[280px] sm:w-[320px] min-h-[460px] sm:min-h-[500px] p-3.5 sm:p-4 pb-6 bg-white border border-stone-300/80 rounded-none sm:rounded-sm shadow-[0_18px_45px_rgba(0,0,0,0.16)] flex flex-col justify-between transition-shadow hover:shadow-[0_25px_60px_rgba(0,0,0,0.22)] z-10"
            >
              {/* ===== 폴라로이드 사진 영역 (Polaroid Photo Slot) ===== */}
              <div className="relative w-full h-[250px] sm:h-[280px] bg-stone-900 border border-stone-300/60 overflow-hidden shadow-inner flex items-center justify-center group shrink-0">
                {log.book.image ? (
                  <img
                    src={log.book.image}
                    alt={log.book.title}
                    className="pointer-events-none w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-800 p-4 text-center">
                    <BookOpen className="w-12 h-12 mb-2 text-stone-500" />
                    <p className="text-xs font-serif text-stone-300 line-clamp-2">
                      {log.book.title}
                    </p>
                  </div>
                )}

              </div>

              {/* ===== 폴라로이드 하단 턱 (Polaroid Bottom Margin & Details) ===== */}
              <div className="flex-1 flex flex-col justify-between pt-3 px-1 min-h-0">
                {/* 도서 제목 & 저자 */}
                <div className="shrink-0">
                  <h4 className="text-sm sm:text-base font-bold font-serif text-stone-900 line-clamp-1 leading-snug break-keep">
                    {log.book.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                    {log.book.author}
                  </p>
                </div>

                {/* 손글씨 / 테이프 스타일 한줄평 (Memo Caption) */}
                <div className="relative mt-2 p-2.5 bg-amber-50/70 rounded-xs border-l-2 border-amber-500/70 flex items-start gap-2 overflow-hidden flex-1 min-h-[50px]">
                  <Quote className="w-3 h-3 text-amber-700/60 shrink-0 mt-0.5 rotate-180" />
                  <div className="flex-1 overflow-hidden">
                    {log.memo ? (
                      <p className="text-stone-800 text-[11px] sm:text-xs font-serif italic leading-relaxed line-clamp-2 break-keep">
                        {log.memo}
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 font-serif italic leading-relaxed">
                        {t("deck.empty_memo")}
                      </p>
                    )}
                  </div>
                </div>

                {/* 폴라로이드 스탬프 & 독서 완료 일자 */}
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-stone-100 text-[10px] font-mono text-stone-400 uppercase tracking-widest shrink-0">
                  <span>{format(new Date(log.date), "yyyy.MM.dd")}</span>
                  <span className="font-semibold text-stone-300">INSTAX • BOOKJEOK</span>
                </div>
              </div>
            </DraggableCardBody>
          );
        })}
      </DraggableCardContainer>

      {/* 하단 공유 링크 복사 버튼 */}
      {!isSharedPage && !readOnly && (
        <div className="mt-6 flex justify-center z-10">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors active:scale-95 duration-200 cursor-pointer bg-white px-4 py-2 rounded-full border border-stone-300 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5 text-stone-500" />
            {t("deck.copy_link")}
          </button>
        </div>
      )}
    </div>
  );
}

