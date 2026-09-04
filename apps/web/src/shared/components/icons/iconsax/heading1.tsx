import { cn } from "@/shared/utils/cn";

import type { IconProps } from "./_base";

/**
 * 직접 그림 (iconsax 24px 그리드 기준)
 * iconsax에 제목 단계 아이콘이 없음 — H 자형(면) + 숫자(선)로 직접 그림
 */
export const Heading1 = ({
  className,
  size = 24,
  ...props
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("shrink-0", className)}
    aria-hidden="true"
    {...props}
  >
    <path d="M4 4.25a.75.75 0 0 1 .75.75v6.25h6.5V5a.75.75 0 0 1 1.5 0v14a.75.75 0 0 1-1.5 0v-6.25h-6.5V19a.75.75 0 0 1-1.5 0V5A.75.75 0 0 1 4 4.25Z" />
      <path d="M16.4 13.5 18.4 12.1V19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
