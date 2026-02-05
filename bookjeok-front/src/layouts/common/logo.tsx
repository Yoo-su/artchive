"use client";

import { motion } from "framer-motion";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface LogoProps {
  size?: "sm" | "md";
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const isSmall = size === "sm";

  // 사이즈별 설정
  const iconSize = isSmall ? 28 : 40; // w-7 vs w-10
  const iconClass = isSmall ? "w-7 h-7" : "w-10 h-10";
  const textSize = isSmall ? "text-[20px]" : "text-[28px]";
  const dotSize = isSmall ? "w-1 h-1" : "w-1.5 h-1.5";
  const underlineHeight = isSmall ? "h-[2px]" : "h-[3px]";
  // 아이콘과 텍스트 사이 간격 (기존보다 살짝 좁힘)
  const gapClass = isSmall ? "gap-1" : "gap-2";

  return (
    <Link
      href={PATHS.HOME}
      passHref
      className="inline-block"
      aria-label="북적 홈으로 이동"
    >
      <motion.div
        className={`group relative flex items-center ${gapClass} cursor-pointer select-none`}
        initial="initial"
        whileHover="hover"
      >
        {/* 아이콘 컨테이너 (3D 느낌의 부유 효과) */}
        <motion.div
          className={`relative ${iconClass}`}
          variants={{
            initial: { rotate: 0, scale: 1, y: 0 },
            hover: {
              rotate: -12,
              scale: 1.1,
              y: isSmall ? -1 : -2,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 15,
              },
            },
          }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-neogulip-primary/20 to-transparent rounded-xl rotate-6 scale-90 blur-sm transition-opacity opacity-0 group-hover:opacity-100" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-square.svg"
            alt="북적"
            width={iconSize}
            height={iconSize}
            className="w-full h-full drop-shadow-sm relative z-10"
          />
        </motion.div>

        {/* 타이포그래피 로고 */}
        <div className="relative flex flex-col justify-center">
          <div className="flex items-baseline leading-none tracking-tighter">
            {/* 'book' - 단단하고 안정적인 느낌 */}
            <span
              className={`${textSize} font-bold font-(family-name:--font-gowun-batang) text-stone-600`}
            >
              book
            </span>
            {/* 'j' - The "Reader J" Icon (독창적 디자인) */}
            <div className="relative mx-0.5 flex items-end self-baseline">
              <svg
                width="16"
                height="28" // 높이 조정 (폰트 높이에 맞춤)
                viewBox="0 0 24 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-[-2px]" // 베이스라인 미세 조정
              >
                {/* Body (Stem & Legs) - 사람이 벽에 기대어 다리를 뻗은 모습 */}
                <path
                  d="M16 10V28C16 34.6274 10.6274 40 4 40H2"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="text-stone-600"
                />
                {/* Head - 책을 보고 있는 고개 */}
                <circle cx="16" cy="4" r="3.5" className="fill-stone-600" />

                {/* Arm - 책을 들고 있는 팔 (섬세한 연결) */}
                <path
                  d="M16 19C16 19 13 22 11 25"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="text-stone-600"
                />

                {/* Book - 품에 안고 있는 책 (Curved Pages, Delicate Stroke) */}
                <path
                  d="M4 21C4 21 8 25 11 25C14 25 18 21 18 21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-emerald-600"
                />
              </svg>
            </div>

            {/* 'eok' - 나머지 텍스트 */}
            <span
              className={`${textSize} font-bold font-(family-name:--font-gowun-batang) text-stone-600 ml-[-3.5px]`}
            >
              eok
            </span>

            {/* 점 제거 (Reader J 자체가 포인트) */}
          </div>

          {/* 애니메이션 밑줄 - Absolute positioning for better vertical alignment */}
          <motion.div
            className={`${underlineHeight} absolute -bottom-1.5 left-0 w-full bg-linear-to-r from-stone-500 to-emerald-600 rounded-full origin-left`}
            variants={{
              initial: { scaleX: 0, opacity: 0 },
              hover: {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.3, ease: "easeOut" },
              },
            }}
          />
        </div>
      </motion.div>
    </Link>
  );
};
