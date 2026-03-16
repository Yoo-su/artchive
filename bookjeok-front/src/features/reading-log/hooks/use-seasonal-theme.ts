import { useMemo } from "react";

import { SEASONAL_THEMES, SeasonalTheme } from "../constants/ui";

export const getSeasonalTheme = (date: Date): SeasonalTheme => {
  const month = date.getMonth() + 1; // 1 ~ 12

  if (month >= 3 && month <= 5) {
    return SEASONAL_THEMES.spring;
  }

  if (month >= 6 && month <= 8) {
    return SEASONAL_THEMES.summer;
  }

  if (month >= 9 && month <= 11) {
    return SEASONAL_THEMES.autumn;
  }

  // 12월, 1월, 2월
  return SEASONAL_THEMES.winter;
};

export const useSeasonalTheme = (date: Date): SeasonalTheme => {
  const theme = useMemo(() => getSeasonalTheme(date), [date]);

  return theme;
};
