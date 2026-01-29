"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/shared/utils/cn";

export const SearchHero = () => {
  const t = useTranslations("book.search");

  // 별 입자 생성 (Hydration 이슈 방지: mounted 체크 후 렌더링)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 상수 정의
  const PARTICLE_COUNT = 35; // 입자 개수
  const EDITORIAL_EASE = [0.16, 1, 0.3, 1] as const; // 애니메이션 이징

  // 별 입자 데이터 생성
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
    id: i,
    xStart: Math.random() * 800,
    yStart: 80 + Math.random() * 60, // 강물 흐름 근처에 배치
    r: Math.random() < 0.2 ? 2 : 1 + Math.random() * 0.5, // 가끔 큰 별 등장
    opacity: 0.3 + Math.random() * 0.5,
    duration: 15 + Math.random() * 20, // 흐르는 속도
    delay: Math.random() * 5,
  }));

  if (!mounted) return <div className="h-[300px] w-full" />;

  return (
    <section className="relative w-full py-16 sm:py-18 flex flex-col items-center justify-center overflow-hidden bg-white select-none">
      {/* 1. 배경 (은은한 그라데이션 오브) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        <motion.div
          className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-slate-100 blur-3xl mix-blend-multiply"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-50 blur-3xl mix-blend-multiply"
          animate={{ x: [0, -40, 0], y: [0, -40, 0] }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* 2. 메인 씬 */}
      <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center">
        {/* SVG 애니메이션 영역 */}
        <div className="relative w-full h-[220px] mb-8 pointer-events-none">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 800 220"
            className="overflow-visible"
          >
            {/* 강물 흐름선 (얇은 곡선) */}
            <motion.path
              d="M -100,100 C 200,80 500,120 900,100"
              fill="none"
              stroke="url(#star-gradient-1)"
              strokeWidth="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 2, ease: EDITORIAL_EASE }}
            />
            <motion.path
              d="M -100,120 C 300,140 600,80 900,110"
              fill="none"
              stroke="url(#star-gradient-2)"
              strokeWidth="0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ duration: 2.5, ease: EDITORIAL_EASE }}
            />

            <defs>
              <linearGradient id="star-gradient-1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0" />
                <stop offset="50%" stopColor="#64748b" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="star-gradient-2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#94a3b8" stopOpacity="0" />
                <stop offset="50%" stopColor="#475569" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 별 입자들 (유동적으로 흐름) */}
            {particles.map((p) => (
              <motion.circle
                key={p.id}
                cx={p.xStart}
                cy={p.yStart}
                r={p.r}
                fill="#475569" // Slate-600 (Dark Star)
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  // Drifting X
                  x: [0, 100],
                  // Twinkling Opacity
                  opacity: [0, p.opacity, 0],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  x: { duration: p.duration, repeat: Infinity, ease: "linear" },
                  opacity: {
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "mirror",
                  },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "mirror",
                  },
                  delay: p.delay,
                }}
              />
            ))}

            {/* 투명한 돋보기 효과 */}
            <foreignObject
              x="0"
              y="0"
              width="800"
              height="220"
              className="overflow-visible"
            >
              <motion.div
                className="absolute w-24 h-24 rounded-full"
                style={{
                  background: "rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(12px)",
                  boxShadow:
                    "0 10px 40px rgba(0,0,0,0.05), inset 0 0 0 1px rgba(255,255,255,0.6)",
                }}
                initial={{ x: 50, y: 80, opacity: 0 }}
                animate={{
                  x: [50, 250, 450, 650],
                  y: [80, 70, 90, 80],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 12,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                {/* 렌즈 테두리 및 반사광 */}
                <div className="absolute inset-1 rounded-full border border-white/30" />

                <div className="absolute top-3 left-4 w-8 h-4 rounded-full bg-linear-to-br from-white/80 to-transparent opacity-60 rotate-[-15deg]" />

                <div className="absolute bottom-3 right-4 w-6 h-6 rounded-full bg-white/20 blur-sm" />
              </motion.div>
            </foreignObject>
          </svg>
        </div>

        {/* Text Reveal */}
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EDITORIAL_EASE }}
            className={cn(
              "font-(family-name:--font-pretendard) text-5xl md:text-6xl font-light tracking-tight text-slate-800",
            )}
          >
            {t("title")}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="flex items-center justify-center gap-4 text-slate-400"
          >
            <span className="w-16 h-px bg-slate-200" />
            <span className="text-xs font-semibold tracking-[0.3em] uppercase">
              {t("subtitle")}
            </span>
            <span className="w-16 h-px bg-slate-200" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
