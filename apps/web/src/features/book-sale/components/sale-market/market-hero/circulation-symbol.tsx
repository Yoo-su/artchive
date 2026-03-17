"use client";

import { motion } from "framer-motion";

export const CirculationSymbol = () => {
  // 반지름과 원주 길이 상수를 정확하게 정의
  const R_OUTER = 40;
  const C_OUTER = 2 * Math.PI * R_OUTER; // ~251.327
  const R_INNER = 32;
  const C_INNER = 2 * Math.PI * R_INNER; // ~201.06

  return (
    <div className="my-10 flex items-center justify-center">
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 12, ease: "linear", repeat: Infinity }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 바깥 구 */}
          <motion.circle
            cx="50"
            cy="50"
            r={R_OUTER}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-zinc-400 dark:text-zinc-500"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${C_OUTER}` }}
            animate={{
              strokeDasharray: [
                `100 ${C_OUTER - 100}`, // 열림 (두 개의 선)
                `${C_OUTER} 0`, // 닫힘 (완전한 원)
                `100 ${C_OUTER - 100}`, // 다시 열림
              ],
              strokeDashoffset: [
                0,
                0,
                -C_OUTER, // 한 바퀴 회전하여 시각적으로 처음과 동일한 위치로 이동
              ],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 4,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Infinity,
            }}
          />

          {/* 안쪽 구 */}
          <motion.circle
            cx="50"
            cy="50"
            r={R_INNER}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-zinc-300 dark:text-zinc-600"
            strokeLinecap="round"
            animate={{
              strokeDasharray: [
                `60 ${C_INNER - 60}`,
                `${C_INNER} 0`,
                `60 ${C_INNER - 60}`,
              ],
              rotate: [0, 180, 360], // 0에서 360까지 연속 회전 (끊김 방지)
            }}
            transition={{
              duration: 4,
              ease: "easeInOut",
              times: [0, 0.5, 1],
              repeat: Infinity,
            }}
          />
        </svg>

        {/* 흔들림 효과 */}
        <motion.div
          className="absolute inset-0 rounded-full border border-zinc-200 dark:border-zinc-800"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </motion.div>
    </div>
  );
};
