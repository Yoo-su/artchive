"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/shared/utils/cn";

import { CirculationSymbol } from "./circulation-symbol";

const ARCHIVE_MESSAGES = [
  "누군가의 서재에서\n새로운 주인을 기다립니다",
  "오래된 책에 담긴 시간이\n다시 흐르기 시작했습니다",
  "서울의 어느 골목에서\n책이 건네어졌습니다",
  "잊혀졌던 문장이\n새로운 눈을 만났습니다",
  "책장의 빈자리가\n또 다른 이야기로 채워집니다",
];

export const MarketHero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ARCHIVE_MESSAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mb-8 flex w-full flex-col items-center justify-center px-4 py-16 md:mb-16 md:py-24">
      {/* 타이틀 영역 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        <span className="mb-3 text-xs font-light tracking-[0.3em] text-zinc-400 dark:text-zinc-500">
          CIRCULATION
        </span>
        <h1
          className={cn(
            "break-keep text-4xl font-normal leading-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl md:text-8xl",
            "font-(family-name:--font-gowun-batang)",
          )}
        >
          순환하는 문장들
        </h1>

        {/* 수직 연결선 대신 Circulation Symbol */}
        <CirculationSymbol />

        {/* 실시간 텍스트 (시적 표현) */}
        <div className="h-20 sm:h-8 overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={cn(
                "whitespace-pre-line md:whitespace-normal text-lg text-zinc-600 dark:text-zinc-400 md:text-xl leading-relaxed",
                "font-(family-name:--font-gowun-batang)",
              )}
            >
              {ARCHIVE_MESSAGES[index]}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 스프링 디바이더 (호흡하는 애니메이션) */}
      <div className="absolute bottom-0 left-0 right-0 flex w-full justify-center overflow-hidden">
        <SpringDivider />
      </div>
    </div>
  );
};

const SpringDivider = () => {
  return (
    <div className="relative h-24 w-full max-w-4xl opacity-30 dark:opacity-20">
      <motion.svg
        viewBox="0 0 1000 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0 50 C 10 20, 10 80, 20 50 C 30 20, 30 80, 40 50 C 50 20, 50 80, 60 50 C 70 20, 70 80, 80 50 C 90 20, 90 80, 100 50 C 110 20, 110 80, 120 50 C 130 20, 130 80, 140 50 C 150 20, 150 80, 160 50 C 170 20, 170 80, 180 50 C 190 20, 190 80, 200 50 C 210 20, 210 80, 220 50 C 230 20, 230 80, 240 50 C 250 20, 250 80, 260 50 C 270 20, 270 80, 280 50 C 290 20, 290 80, 300 50 C 310 20, 310 80, 320 50 C 330 20, 330 80, 340 50 C 350 20, 350 80, 360 50 C 370 20, 370 80, 380 50 C 390 20, 390 80, 400 50 C 410 20, 410 80, 420 50 C 430 20, 430 80, 440 50 C 450 20, 450 80, 460 50 C 470 20, 470 80, 480 50 C 490 20, 490 80, 500 50 C 510 20, 510 80, 520 50 C 530 20, 530 80, 540 50 C 550 20, 550 80, 560 50 C 570 20, 570 80, 580 50 C 590 20, 590 80, 600 50 C 610 20, 610 80, 620 50 C 630 20, 630 80, 640 50 C 650 20, 650 80, 660 50 C 670 20, 670 80, 680 50 C 690 20, 690 80, 700 50 C 710 20, 710 80, 720 50 C 730 20, 730 80, 740 50 C 750 20, 750 80, 760 50 C 770 20, 770 80, 780 50 C 790 20, 790 80, 800 50 C 810 20, 810 80, 820 50 C 830 20, 830 80, 840 50 C 850 20, 850 80, 860 50 C 870 20, 870 80, 880 50 C 890 20, 890 80, 900 50 C 910 20, 910 80, 920 50 C 930 20, 930 80, 940 50 C 950 20, 950 80, 960 50 C 970 20, 970 80, 980 50 C 990 20, 990 80, 1000 50"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          className="text-zinc-400 dark:text-zinc-600"
          animate={{
            scaleX: [1, 1.8, 0.6, 1], // 보통 -> 늘어남 (긴장) -> 압축됨 -> 보통
          }}
          transition={{
            duration: 10, // 덜 산만하도록 느린 모션
            ease: "easeInOut",
            times: [0, 0.4, 0.7, 1], // 늘어남 vs 압축됨 시간 분배
            repeat: Infinity,
            repeatDelay: 1, // 사이클 간 일시정지
          }}
          style={{ transformOrigin: "center" }}
        />
        {/* 복잡성이 필요한 경우 미러 경로 추가, 또는 요청대로 '얇은 선' 유지 */}
      </motion.svg>
    </div>
  );
};

// ... (removed inline component)
