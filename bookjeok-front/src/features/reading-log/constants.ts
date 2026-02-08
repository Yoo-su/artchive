export const READING_LOG_COLORS = {
  // 따뜻한 서재 테마 -> 가을 테마(Autumn)로 통합 예정
  cozy: {
    dark: "#78350f", // amber-900 (텍스트, 강한 강조)
    medium: "#d97706", // amber-600 (포인트, 활성 상태)
    light: "#f59e0b", // amber-500 (보조)
    soft: "#fef3c7", // amber-100 (연한 배경)
    bg: "#fffbeb", // amber-50 (배경)
    text: "#57534e", // stone-600 (본문)
  },
  // 포인트 (Deep Rose)
  point: {
    dark: "#be123c", // rose-700
    medium: "#f43f5e", // rose-500
    light: "#fda4af", // rose-300
  },
  gray: {
    border: "#e7e5e4", // stone-200
    text: "#44403c", // stone-700
    subText: "#a8a29e", // stone-400
    bg: "#fafaf9", // stone-50
  },
} as const;

export const SEASONAL_THEMES = {
  spring: {
    name: "spring",
    label: "Spring Dandelion",
    primary: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    accent: "text-yellow-500",
    ring: "ring-yellow-200",
    gradient: "from-yellow-50 via-white to-yellow-50",
    hoverBg: "hover:bg-yellow-50/80",
    activeText: "text-yellow-700",
    todayBg: "bg-yellow-400",
    todayText: "text-yellow-950",
  },
  summer: {
    name: "summer",
    label: "Fresh Summer",
    primary: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    accent: "text-green-500",
    ring: "ring-green-200",
    gradient: "from-green-50 via-white to-green-50",
    hoverBg: "hover:bg-green-50/80",
    activeText: "text-green-700",
    todayBg: "bg-green-600",
    todayText: "text-white",
  },
  autumn: {
    name: "autumn",
    label: "Deep Autumn",
    primary: "text-orange-800",
    bg: "bg-orange-50",
    border: "border-orange-200",
    accent: "text-stone-600",
    ring: "ring-orange-200",
    gradient: "from-orange-50 via-stone-50 to-orange-50",
    hoverBg: "hover:bg-orange-100/50",
    activeText: "text-orange-900",
    todayBg: "bg-orange-700",
    todayText: "text-white",
  },
  winter: {
    name: "winter",
    label: "Snowy Winter",
    primary: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    accent: "text-slate-400",
    ring: "ring-slate-200",
    gradient: "from-slate-50 via-gray-50 to-slate-50",
    hoverBg: "hover:bg-slate-100/50",
    activeText: "text-slate-700",
    todayBg: "bg-slate-600",
    todayText: "text-white",
  },
} as const;

export type SeasonalTheme =
  (typeof SEASONAL_THEMES)[keyof typeof SEASONAL_THEMES];

export const MAX_MEMO_LENGTH = 50;
