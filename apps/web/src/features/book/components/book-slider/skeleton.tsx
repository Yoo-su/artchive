"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/shared/components/shadcn/skeleton";

export const BookSliderSkeleton = () => {
  // 화면 크기별 반응형 파라미터 (여백 최적화 및 간격 조정)
  const [radius, setRadius] = useState(580);
  const [cardWidth, setCardWidth] = useState(180);
  const [cardHeight, setCardHeight] = useState(270);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width > 1024) {
        setRadius(580);
        setCardWidth(180);
        setCardHeight(270);
      } else if (width > 768) {
        setRadius(460);
        setCardWidth(140);
        setCardHeight(210);
      } else if (width > 480) {
        setRadius(360);
        setCardWidth(110);
        setCardHeight(165);
      } else {
        setRadius(300);
        setCardWidth(90);
        setCardHeight(135);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="w-full flex flex-col items-center select-none pointer-events-none">
      <div
        style={{
          perspective: 1200,
          perspectiveOrigin: "center 30%",
        }}
        className="relative flex items-center justify-center w-full h-[180px] sm:h-[220px] md:h-[270px] lg:h-[330px] overflow-visible"
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `translateZ(-${radius}px)`, // 3D 원근법 확대 왜곡을 보정하기 위해 좌표축 공간을 뒤로 이동
            width: cardWidth,
            height: cardHeight,
          }}
          className="relative"
        >
          {[...Array(15)].map((_, i) => {
            const angle = i * 24; // 15개 카드 분할 각도
            const total = ((angle % 360) + 360) % 360;
            const relativeAngle = total > 180 ? total - 360 : total;
            const absAngle = Math.abs(relativeAngle);

            // 실제 슬라이더와 정확히 일치하는 크기 및 투명도 계산 (블러 없음)
            let scale = 0.65;
            let opacity = 0.15;

            if (absAngle <= 60) {
              const t = absAngle / 60;
              scale = 1.05 - t * 0.15;
              opacity = 1.0 - t * 0.4;
            } else if (absAngle <= 120) {
              const t = (absAngle - 60) / 60;
              scale = 0.9 - t * 0.15;
              opacity = 0.6 - t * 0.35;
            } else {
              const t = (absAngle - 120) / 60;
              scale = 0.75 - t * 0.1;
              opacity = 0.25 - t * 0.1;
            }

            const zIndex = Math.round(200 - absAngle);

            return (
              // 외곽 레이어: 정적 3D 실린더 배치 담당
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                }}
              >
                {/* 내부 레이어: 동적 크기, 투명도 스타일링 (블러 없음) */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    scale,
                    opacity: Math.max(0, opacity),
                    zIndex,
                  }}
                  className="rounded-2xl bg-stone-100/50 border border-stone-200/40 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)] w-full h-full"
                >
                  <Skeleton className="w-full h-full bg-stone-200/50 rounded-2xl animate-pulse" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 바닥 그림자 */}
        <div className="absolute bottom-[-35px] left-1/2 -translate-x-1/2 w-[85%] h-[35px] bg-stone-900/5 rounded-full blur-2xl -z-10" />
      </div>

      {/* 활성 도서 정보 텍스트 영역 스켈레톤 */}
      <div className="container mx-auto mt-16 flex flex-col items-center text-center space-y-2.5 h-[80px]">
        <Skeleton className="h-7 md:h-9 w-48 md:w-64 bg-stone-200/60 rounded-lg animate-pulse" />
        <Skeleton className="h-4 md:h-5 w-32 md:w-40 bg-stone-200/40 rounded-lg animate-pulse" />
      </div>
    </div>
  );
};
