import type React from "react";

/** iconsax 아이콘 공통 props. 색은 currentColor를 따르고, 크기는 className으로도 덮어쓸 수 있다. */
export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  /** 좋아요·재생처럼 채워진 상태가 필요할 때 "bold"를 넘긴다. 일부 아이콘만 지원한다. */
  variant?: "outline" | "bold";
}
