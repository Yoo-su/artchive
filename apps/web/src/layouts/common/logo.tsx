"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface LogoProps {
  size?: "sm" | "md";
}

export const Logo = ({ size = "md" }: LogoProps) => {
  const isSmall = size === "sm";

  // 사이즈별 SVG 높이 지정 (비율 유지)
  const svgClass = isSmall ? "h-7 sm:h-8" : "h-10 sm:h-12";

  return (
    <Link
      href={PATHS.HOME}
      passHref
      className="inline-block"
      aria-label="북적 홈으로 이동"
    >
      <motion.div
        className="group relative flex items-center cursor-pointer select-none"
        initial="initial"
        whileHover="hover"
      >
        <Image
          src="/logo-square-sketch.svg"
          alt=""
          width={isSmall ? 28 : 30}
          height={isSmall ? 28 : 30}
          className="mr-0.5 object-contain"
          unoptimized
        />
        {/* 수제 손글씨 텍스트 로고 (프로페셔널 마커 스타일) */}
        <div className="relative flex flex-col justify-center mt-1">
          <svg
            viewBox="0 0 215 100"
            className={`${isSmall ? "h-[26px]" : "h-[36px]"} w-auto text-stone-900`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* b */}
            <path d="M 20,18 Q 18,45 20,72" />
            <path d="M 20,48 C 34,42 40,68 20,70" />

            {/* o1 */}
            <ellipse
              cx="46"
              cy="59"
              rx="9"
              ry="11"
              transform="rotate(-4 46 59)"
            />

            {/* o2 */}
            <ellipse
              cx="69"
              cy="59"
              rx="9"
              ry="11"
              transform="rotate(-2 69 59)"
            />

            {/* k1 */}
            <path d="M 88,18 Q 86,45 88,72" />
            <path d="M 103,46 C 96,50 92,54 88,58" />
            <path d="M 91,55 C 96,62 100,68 103,72" />

            {/* j */}
            <path d="M 114,46 L 114,82 C 114,93 102,96 102,85" />
            <circle
              cx="114"
              cy="28"
              r="3.5"
              fill="currentColor"
              stroke="none"
            />

            {/* e */}
            <path d="M 126,60 Q 135,59 143,56 C 143,40 125,40 126,58 C 126,71 138,72 146,67" />

            {/* o3 */}
            <ellipse
              cx="161"
              cy="59"
              rx="9"
              ry="11"
              transform="rotate(-5 161 59)"
            />

            {/* k2 */}
            <path d="M 183,18 Q 181,45 183,72" />
            <path d="M 198,46 C 191,50 187,54 183,58" />
            <path d="M 186,55 C 191,62 195,68 198,72" />
          </svg>

          {/* hover 밑줄 */}
          {/* <motion.div
            className="h-[2px] absolute -bottom-1 left-0 w-full rounded-full origin-left bg-stone-800"
            variants={{
              initial: { scaleX: 0, opacity: 0 },
              hover: {
                scaleX: 1,
                opacity: 0.8,
                transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          /> */}
        </div>
      </motion.div>
    </Link>
  );
};
