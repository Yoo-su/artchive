"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Label } from "@/shared/components/shadcn/label";
import { Switch } from "@/shared/components/shadcn/switch";
import { cn } from "@/shared/utils";

import { useSeasonalTheme } from "../../../hooks/use-seasonal-theme";
import {
  useReadingLogSettingsQuery,
  useUpdateReadingLogSettingsMutation,
} from "../../../queries";

interface ReadingLogHeroProps {
  currentDate: Date;
}

export function ReadingLogHero({ currentDate }: ReadingLogHeroProps) {
  const t = useTranslations("reading_log.hero");
  // 테마 및 배경 이미지 로직
  const theme = useSeasonalTheme(currentDate);
  const [isMounted, setIsMounted] = useState(false);
  const [bgImage, setBgImage] = useState<string>("");
  const [isImageLoading, setIsImageLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const seasonName = useMemo(() => {
    return theme.name === "autumn" ? "fall" : theme.name;
  }, [theme.name]);

  useEffect(() => {
    // 계절이 바뀔 때만 랜덤 이미지 재선택 (또는 페이지 로드 시)
    const randomNum = Math.floor(Math.random() * 2) + 1;
    setBgImage(`/images/season/${seasonName}${randomNum}.jpg`);
    setIsImageLoading(true); // 이미지 변경 시 로딩 시작
  }, [seasonName]);

  // 공개 설정 로직
  const { data: settings } = useReadingLogSettingsQuery();
  const { mutate: updateSettings, isPending } =
    useUpdateReadingLogSettingsMutation();
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (settings) {
      setIsPublic(settings.isReadingLogPublic ?? true);
    }
  }, [settings]);

  const handleToggle = (checked: boolean) => {
    setIsPublic(checked);
    updateSettings(checked);
  };

  if (!isMounted) return null;

  return (
    <section className="relative h-[320px] md:h-[400px] w-full mb-8 rounded-3xl overflow-hidden shadow-2xl shadow-stone-200/50 ring-1 ring-black/5 group bg-stone-900">
      {/* 배경 이미지 (검정 배경 위로 페이드인) */}
      {bgImage && (
        <Image
          src={bgImage}
          alt="Seasonal Background"
          fill
          priority
          onLoad={() => setIsImageLoading(false)}
          className={cn(
            "object-cover object-center transition-opacity duration-1000",
            // 로딩 중이거나 이미지가 없을 때 숨김
            isImageLoading ? "opacity-0" : "opacity-100",
            // 계절별 필터 (감조)
            theme.name === "summer" && "saturate-[1.1] brightness-[1.05]",
            theme.name === "winter" && "brightness-[1.1] contrast-[0.95]",
            theme.name === "spring" && "saturate-[1.1] brightness-[1.05]",
            theme.name === "autumn" && "sepia-[0.1] contrast-[1.05]",
          )}
        />
      )}

      {/* 오버레이 (텍스트 가독성 + 분위기) */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          isImageLoading ? "opacity-0" : "opacity-100", // 이미지와 함께 나타나도록
          // 테마별 그라데이션 오버레이
          theme.name === "summer"
            ? "bg-linear-to-r from-green-900/60 via-emerald-800/20 to-transparent"
            : theme.name === "winter"
              ? "bg-linear-to-r from-slate-900/60 via-slate-800/30 to-transparent"
              : theme.name === "autumn"
                ? "bg-linear-to-r from-orange-950/70 via-brown-900/40 to-transparent"
                : "bg-linear-to-r from-black/50 via-black/20 to-transparent", // Spring or Default
        )}
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 h-full container flex flex-col justify-end pb-10 md:pb-12 px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* 타이틀 영역 */}
          <div className="text-white drop-shadow-md space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div
              className={cn(
                "text-sm md:text-base font-medium px-3 py-1 rounded-full w-fit backdrop-blur-md border border-white/20 shadow-inner",
                theme.bg ? theme.bg.replace("50", "500/30") : "bg-white/20",
                "text-white",
              )}
            >
              {t(`season_label.${theme.name}`)}
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-shadow-lg">
              {t("title")}
            </h1>
            <p className="text-white/90 text-sm md:text-lg font-light leading-relaxed max-w-md whitespace-pre-wrap">
              {t("subtitle")}
            </p>
          </div>

          {/* 스위치 UI (Glassmorphism) */}
          <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:bg-white/15 transition-colors duration-300">
            <Switch
              id="public-mode"
              checked={isPublic}
              disabled={isPending}
              onCheckedChange={handleToggle}
              className={cn(
                "data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-black/20 border-2 border-transparent transition-colors",
                isPublic &&
                  "border-sky-400/50 shadow-[0_0_10px_rgba(14,165,233,0.4)]",
              )}
            />
            <div className="flex flex-col">
              <Label
                htmlFor="public-mode"
                className="font-medium cursor-pointer text-white text-base"
              >
                {t("public_toggle")}
              </Label>
              <span className="text-xs text-white/70 mt-0.5">
                {isPublic ? t("public_label_on") : t("public_label_off")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
