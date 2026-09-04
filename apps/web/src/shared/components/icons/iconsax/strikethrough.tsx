import { cn } from "@/shared/utils/cn";

import type { IconProps } from "./_base";

/**
 * 직접 그림 (iconsax 24px 그리드 기준)
 * iconsax에 취소선이 없음 — text-underline의 글자꼴에 가운데 선을 그어 구성
 */
export const Strikethrough = ({
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
    <path d="M12 17.75c-4.27 0-7.75-3.48-7.75-7.75V3a.75.75 0 0 1 1.5 0v7A6.26 6.26 0 0 0 12 16.25 6.26 6.26 0 0 0 18.25 10V3a.75.75 0 0 1 1.5 0v7c0 4.27-3.48 7.75-7.75 7.75Z" />
      <path d="M21 12.75H3a.75.75 0 0 1 0-1.5h18a.75.75 0 0 1 0 1.5Z" />
  </svg>
);
