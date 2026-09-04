import { cn } from "@/shared/utils/cn";

import type { IconProps } from "./_base";

/**
 * iconsax · tick-square (outline, 일부 path 추출)
 * tick-square에서 체크 표시만 추출 (테두리 없는 체크가 free 세트에 없음)
 */
export const Check = ({ className, size = 24, ...props }: IconProps) => (
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
    <g transform="translate(12 12) scale(1.3) translate(-12 -12)">
      <path
        d="M10.5799 15.5796C10.3799 15.5796 10.1899 15.4996 10.0499 15.3596L7.21994 12.5296C6.92994 12.2396 6.92994 11.7596 7.21994 11.4696C7.50994 11.1796 7.98994 11.1796 8.27994 11.4696L10.5799 13.7696L15.7199 8.62961C16.0099 8.33961 16.4899 8.33961 16.7799 8.62961C17.0699 8.91961 17.0699 9.39961 16.7799 9.68961L11.1099 15.3596C10.9699 15.4996 10.7799 15.5796 10.5799 15.5796Z"
        fill="currentColor"
      />
    </g>
  </svg>
);

export { Check as CheckIcon };
