"use client";

import { motion } from "framer-motion";

import { SceneData } from "@/features/intro/types";
import { cn } from "@/shared/utils/cn";

// -----------------------------------------------------------------------------
// 레이아웃 2: 중고책 (Used)
// 스타일: 모던, 명료함, 스위스 스타일 산세리프 (Modern, Clear, Swiss-Style Sans)
// -----------------------------------------------------------------------------
export const UsedScene = ({ data }: { data: SceneData }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pb-10 text-center">
      {/* 시각 효과: 연결 점 (깔끔하고 기술적인 느낌) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
        <div className="relative h-[600px] w-[600px] shrink-0">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 rounded-full border border-black"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="absolute inset-[100px] rounded-full border border-black"
          />
        </div>
      </div>

      <div className="relative z-10 md:-mt-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex justify-center"
        >
          <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-bold tracking-widest text-slate-900 uppercase">
            {data.sub}
          </span>
        </motion.div>

        {/* 헤더: 굵은 산세리프, 좁은 자간 (Heavy Sans, Tight Tracking) */}
        <div className="flex flex-col items-center">
          <motion.h2
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "font-(family-name:--font-pretendard) whitespace-pre-wrap text-6xl font-extrabold leading-[1.05] tracking-tighter text-slate-950 sm:text-7xl md:text-[5.5rem]", // Enterprise Look을 위한 Pretendard 사용
            )}
          >
            {data.header}
          </motion.h2>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 text-lg font-medium text-slate-600 md:text-xl"
        >
          {data.desc}
        </motion.p>
      </div>
    </div>
  );
};
