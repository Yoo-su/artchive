"use client";

import { MapPin } from "lucide-react";
import React from "react";

interface RegionDisplayCardProps {
  city?: string;
  district?: string;
  placeName?: string;
  error?: string;
}

/**
 *과도한 글로우/핑 애니메이션을 배제하고, 절제된 타이포그래피와 구조적 라벨링을 적용한 거래 지역 안내 카드입니다.
 */
export const RegionDisplayCard: React.FC<RegionDisplayCardProps> = ({
  city,
  district,
  placeName,
  error,
}) => {
  const hasRegion = Boolean(city && district);

  if (!hasRegion) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-900/40 px-4 py-3 text-sm">
          <MapPin className="h-4 w-4 text-stone-400 shrink-0" />
          <span className="text-stone-500 dark:text-stone-400">
            지도에서 위치를 선택하면 시/도 및 시/군/구 지역이 지정됩니다.
          </span>
        </div>
        {error && (
          <p className="text-xs font-medium text-destructive px-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/70 px-4 py-3 text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <MapPin className="h-4 w-4 text-stone-700 dark:text-stone-300 shrink-0" />
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider shrink-0">
            거래 지역
          </span>
          <span className="h-3 w-px bg-stone-300 dark:bg-stone-700 shrink-0" />
          <span className="font-semibold text-stone-900 dark:text-stone-100 truncate">
            {city} {district}
          </span>
        </div>

        {placeName && (
          <span className="text-xs font-medium text-stone-500 dark:text-stone-400 bg-stone-200/60 dark:bg-stone-800 px-2.5 py-1 rounded-md shrink-0 truncate max-w-[180px]">
            {placeName}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-destructive px-1">{error}</p>
      )}
    </div>
  );
};
