"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

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
          <Image
            src="/logo-square.svg"
            alt="북적"
            width={iconSize}
            height={iconSize}
            className="w-full h-full drop-shadow-sm relative z-10"
          />
        </motion.div>

        {/* 타이포그래피 로고 */}
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline leading-none tracking-tighter">
            {/* 'book' - 단단하고 안정적인 느낌 */}
            <span
              className={`${textSize} font-black font-(family-name:--font-pretendard) text-(--color-neogulip-deep)`}
            >
              book
            </span>
            {/* 'jeok' - 생동감 넘치고 활동적인 느낌 */}
            <span
              className={`${textSize} font-black font-(family-name:--font-pretendard) ml-px bg-linear-to-r from-neogulip-primary to-neogulip-dark bg-clip-text text-transparent group-hover:to-neogulip-light transition-all duration-300`}
            >
              jeok
            </span>

            {/* 마침표 점 (현대적인 감각) */}
            <motion.div
              className={`${dotSize} rounded-full bg-neogulip-primary ml-0.5 mb-1`}
              variants={{
                initial: { scale: 0, opacity: 0 },
                hover: { scale: 1, opacity: 1 },
              }}
            />
          </div>

          {/* 애니메이션 밑줄 */}
          <motion.div
            className={`${underlineHeight} bg-linear-to-r from-neogulip-deep to-neogulip-primary rounded-full mt-1 origin-left`}
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
