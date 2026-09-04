import { cn } from "@/shared/utils/cn";

import type { IconProps } from "./_base";

/**
 * iconsax · close-circle (outline, 일부 path 추출)
 * close-circle에서 X만 추출
 */
export const X = ({
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
    <g transform="translate(12 12) scale(1.6) translate(-12 -12)"><path d="M9.17011 15.5794C8.98011 15.5794 8.79011 15.5094 8.64011 15.3594C8.35011 15.0694 8.35011 14.5894 8.64011 14.2994L14.3001 8.63938C14.5901 8.34938 15.0701 8.34938 15.3601 8.63938C15.6501 8.92937 15.6501 9.40937 15.3601 9.69937L9.70011 15.3594C9.56011 15.5094 9.36011 15.5794 9.17011 15.5794Z" fill="currentColor"/><path d="M14.8301 15.5794C14.6401 15.5794 14.4501 15.5094 14.3001 15.3594L8.64011 9.69937C8.35011 9.40937 8.35011 8.92937 8.64011 8.63938C8.93011 8.34938 9.41011 8.34938 9.70011 8.63938L15.3601 14.2994C15.6501 14.5894 15.6501 15.0694 15.3601 15.3594C15.2101 15.5094 15.0201 15.5794 14.8301 15.5794Z" fill="currentColor"/></g>
  </svg>
);

export { X as XIcon };
