import { cn } from "@/shared/utils/cn";

import type { IconProps } from "./_base";

/**
 * 직접 그림 (iconsax 24px 그리드 기준)
 * 스피너는 아이콘 팩에 없음 — 270° 호로 직접 그림 (animate-spin 전제)
 */
export const Loader2 = ({ className, size = 24, ...props }: IconProps) => (
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
    <path
      d="M12 3.25a8.75 8.75 0 1 1-8.75 8.75"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

export { Loader2 as Loader2Icon };
