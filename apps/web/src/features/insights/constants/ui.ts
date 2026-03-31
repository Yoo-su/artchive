import { ReviewReactionType } from "@bookjeok/core";
// 색상 팔레트: Stone & Mono (Editorial Style)
export const COLORS = {
  // 메인 (Stone/Gray)
  stone: {
    900: "#1c1917", // Title
    800: "#292524",
    700: "#44403c",
    600: "#57534e", // Text
    500: "#78716c",
    400: "#a8a29e", // Subtext
    300: "#d6d3d1", // Border
    200: "#e7e5e4", // Light Border
    100: "#f5f5f4", // Background
    50: "#fafaf9",
  },
  // 포인트 (Muted/Nature)
  sage: "#7a8578", // 차분한 녹색
  rust: "#a67c6d", // 차분한 갈색
  clay: "#b3aa9f", // 웜그레이
  sand: "#e3dfd3", // 종이 질감
} as const;

export const CHART_COLORS = {
  primary: COLORS.stone[800],
  secondary: COLORS.stone[500],
  tertiary: COLORS.stone[300],
  quaternary: COLORS.sage,
  quinary: COLORS.rust,
  senary: COLORS.clay,
} as const;

// 막대 차트 색상 (단색 계열의 그라데이션 느낌 or 차분한 조합)
export const BAR_CHART_COLORS = [
  COLORS.stone[800],
  COLORS.stone[600],
  COLORS.stone[500],
  COLORS.stone[400],
  COLORS.sage,
  COLORS.rust,
  COLORS.clay,
  COLORS.stone[300],
];

// 리액션 타입별 색상
export const REACTION_COLORS: Record<string, string> = {
  [ReviewReactionType.LIKE]: "#dfaea4", // Muted Coral
  [ReviewReactionType.INSIGHTFUL]: "#dad2b6", // Muted Gold
  [ReviewReactionType.SUPPORT]: "#abc4ab", // Muted Green
};

// 활동 추이 차트 색상
export const TREND_COLORS = {
  sales: COLORS.stone[800],
  reviews: COLORS.sage,
};
