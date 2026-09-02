"use client";

import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { cn } from "@/shared/utils/cn";

interface ImageLightboxProps {
  /** 표시할 이미지 URL 목록 */
  images: string[];
  /** 처음 표시할 이미지 인덱스 */
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 접근성용 제목 (시각적으로는 숨김) */
  title?: string;
}

/**
 * 이미지를 확대해서 보는 라이트박스입니다.
 * - 여러 장인 경우 좌우 이동 및 방향키 조작을 지원합니다.
 * - 채팅 위젯(z-999) 위에 표시되어야 하므로 오버레이/콘텐츠 모두 z-1000을 사용합니다.
 *
 * 이미지 크기를 미리 알 수 없어 로드 전에는 래퍼가 0에 가깝게 접히고,
 * 그 안에 절대 배치된 닫기/이동 버튼이 한곳에 겹쳐 보이는 문제가 있었습니다.
 * 그래서 뷰포트 기준으로 크기가 고정된 무대(stage)를 먼저 깔고 그 안에서
 * 이미지를 맞춰 넣습니다. 버튼 위치는 로딩 여부와 무관하게 처음부터 고정됩니다.
 */
export const ImageLightbox = ({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
  title,
}: ImageLightboxProps) => {
  const t = useTranslations("common");
  const [index, setIndex] = useState(initialIndex);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // 열릴 때마다 클릭한 이미지로 위치를 맞춥니다.
  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const hasMultiple = images.length > 1;

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open || !hasMultiple) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    // 다이얼로그가 포커스를 가두므로 캡처 단계에서 받아야 안정적으로 동작합니다.
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, hasMultiple, goPrev, goNext]);

  const currentImage = images[index];

  // 이미지가 바뀌면 다시 로딩 상태로 돌아갑니다.
  useEffect(() => {
    setIsImageLoaded(false);
  }, [currentImage]);

  // 닫힌 상태에서는 Dialog 자체를 마운트하지 않습니다.
  // 공용 Dialog는 닫혀도 포털이 DOM에 남아 투명한 오버레이가 클릭을 가로채므로,
  // 언마운트시켜 잔여 오버레이가 남지 않도록 합니다.
  if (!open || !currentImage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="z-1000"
        showCloseButton={false}
        className="z-1000 w-fit max-w-none border-none bg-transparent p-0 shadow-none"
      >
        <DialogTitle className="sr-only">
          {title ?? t("image.viewer_title")}
        </DialogTitle>

        {/* 로딩 여부와 무관하게 크기가 고정된 무대. 버튼이 흔들리지 않는 기준이 된다. */}
        <div className="relative h-[80vh] w-[92vw] sm:max-w-3xl">
          {!isImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2
                className="h-8 w-8 animate-spin text-white/70"
                aria-hidden="true"
              />
            </div>
          )}

          <Image
            key={currentImage}
            src={currentImage}
            alt={t("aria.preview_image", { index: index + 1 })}
            fill
            // 다이얼로그가 열리는 즉시 필요한 이미지라 지연 로딩하지 않습니다.
            priority
            sizes="(max-width: 640px) 92vw, 768px"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setIsImageLoaded(true)}
            className={cn(
              "rounded-lg object-contain transition-opacity duration-200",
              isImageLoaded ? "opacity-100" : "opacity-0",
            )}
          />

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={t("aria.close")}
            className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label={t("aria.prev_image")}
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={t("aria.next_image")}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {hasMultiple && (
          <div className="flex items-center justify-center gap-1.5 pb-2">
            {images.map((url, i) => (
              <span
                key={url}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/50",
                )}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
