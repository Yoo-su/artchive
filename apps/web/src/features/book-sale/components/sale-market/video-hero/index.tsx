"use client";

import { motion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMarketHeroStats } from "@/features/book-sale/hooks/use-market-hero-stats";
import { AvatarCircles } from "@/shared/components/magicui/avatar-circles";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { usePrefersReducedMotion } from "@/shared/hooks/use-prefers-reduced-motion";

const VIDEO_SRC = "/videos/bookjeok_market_video.mp4";

/** 리빌 스크림 위에 얹는 미세한 필름 그레인. 이미지 에셋 없이 SVG 노이즈로 생성한다. */
const GRAIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
  '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />' +
  '<feColorMatrix type="saturate" values="0" /></filter>' +
  '<rect width="100%" height="100%" filter="url(#grain)" /></svg>';
const GRAIN_BACKGROUND_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;

/**
 * 영상 재생 → 종료 → 어두운 안개 + 카피 노출 순서로 진행되는 상태 머신.
 * "error"는 영상 로드/재생이 실패했을 때 곧장 카피만 보여주기 위한 폴백.
 */
type Phase = "loading" | "playing" | "revealed" | "error";

export const VideoHero = () => {
  const t = useTranslations("market");
  const prefersReducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [progress, setProgress] = useState(0);

  const { freshCount, newTodayLabel, regionCount, sellers, hasStats } =
    useMarketHeroStats();

  useEffect(() => {
    videoRef.current?.play().catch(() => {
      setPhase("error");
    });
  }, []);

  const handleCanPlay = useCallback(() => {
    setPhase((prev) => (prev === "loading" ? "playing" : prev));
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  }, []);

  const handleEnded = useCallback(() => setPhase("revealed"), []);
  const handleError = useCallback(() => setPhase("error"), []);

  const showCopy = phase === "revealed" || phase === "error";
  const showVideo = phase !== "error";
  const isDimmed = phase === "revealed";

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.13,
        delayChildren: prefersReducedMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.35 : 0.75,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  /** 헤드라인/서브카피 전용: overflow-hidden 마스크 안에서 아래→위로 드러나는 리빌. */
  const textRevealVariants: Variants = {
    hidden: { y: prefersReducedMotion ? "0%" : "100%" },
    visible: {
      y: "0%",
      transition: {
        duration: prefersReducedMotion ? 0.35 : 0.85,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section className="relative -mx-4 mb-10 aspect-video w-[calc(100%+2rem)] min-h-[460px] overflow-hidden bg-neutral-950 sm:-mx-6 sm:w-[calc(100%+3rem)] sm:min-h-[520px] md:mb-14 md:min-h-[600px]">
      {/* 로딩 중 빈 화면 대신 은은한 펄스로 대기 상태를 알려준다. */}
      {phase === "loading" && (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="h-2 w-2 animate-pulse rounded-full bg-white/30" />
        </div>
      )}

      {showVideo && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-[1400ms] ease-out ${
            phase === "loading" ? "opacity-0" : "opacity-100"
          } ${isDimmed ? "scale-[1.03] brightness-[0.55] blur-[2px] saturate-[0.85]" : ""}`}
          src={VIDEO_SRC}
          autoPlay
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          aria-hidden="true"
          onCanPlay={handleCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleError}
        />
      )}

      {/* 재생 진행률. 리빌이 시작되는 순간 함께 사라진다. */}
      {showVideo && (
        <div
          aria-hidden
          className={`absolute inset-x-0 bottom-0 h-[2px] bg-white/10 transition-opacity duration-500 ${
            showCopy ? "opacity-0" : "opacity-100"
          }`}
        >
          <div
            className="h-full bg-white/70"
            style={{ width: `${progress}%`, transition: "width 150ms linear" }}
          />
        </div>
      )}

      {showCopy && (
        <>
          {/* 정지된 마지막 프레임 위로 안개처럼 서서히, 화면 전체가 고르게 어두워진다. */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: prefersReducedMotion ? 0.4 : 1.2,
              ease: "easeOut",
            }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/20" />
            {/* 필름 그레인. overlay 블렌드로 아주 옅게, 평평한 디지털 톤을 깨준다. */}
            <div
              className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
              style={{
                backgroundImage: GRAIN_BACKGROUND_IMAGE,
                backgroundSize: "160px 160px",
              }}
            />
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 py-10 text-center sm:gap-6"
          >
            <div className="overflow-hidden">
              <motion.h1
                variants={textRevealVariants}
                className="break-keep font-(family-name:--font-gowun-batang) text-[1.9rem] leading-[1.3] text-white sm:text-[2.5rem] md:text-[3.1rem]"
              >
                {t("videoHero.title")}
              </motion.h1>
            </div>

            <div className="overflow-hidden">
              <motion.p
                variants={textRevealVariants}
                className="max-w-sm break-keep text-[13.5px] leading-relaxed text-neutral-200 sm:text-[15px]"
              >
                {t("videoHero.subtitle")}
              </motion.p>
            </div>

            {hasStats && (
              <motion.div
                variants={itemVariants}
                className="flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-1"
              >
                {freshCount > 0 && (
                  <StatCell
                    value={newTodayLabel}
                    label={t("hero.stats.new_listings")}
                  />
                )}
                {regionCount > 0 && (
                  <StatCell
                    value={String(regionCount)}
                    label={t("hero.stats.regions")}
                  />
                )}
                {sellers.length > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <AvatarCircles
                      avatars={sellers.slice(0, 4)}
                      extraCount={Math.max(0, sellers.length - 4)}
                      size="sm"
                      className="[&>div]:h-6 [&>div]:w-6 [&>div]:border-black/50"
                    />
                    <span className="text-[11px] tracking-tight text-neutral-300">
                      {t("hero.stats.sellers")}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            <motion.div variants={itemVariants}>
              <Link
                href={PATHS.BOOK_SALES_REGISTER}
                className="group pointer-events-auto inline-flex items-center gap-2.5 bg-white px-6 py-3.5 text-sm font-medium text-neutral-950 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-[0_10px_36px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {t("hero.cta_sell")}
                <ArrowUpRight
                  className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  strokeWidth={1.5}
                />
              </Link>
            </motion.div>
          </motion.div>
        </>
      )}
    </section>
  );
};

const StatCell = ({ value, label }: { value: string; label: string }) => (
  <div>
    <span className="block font-(family-name:--font-gowun-batang) text-xl leading-none tabular-nums text-white sm:text-2xl">
      {value}
    </span>
    <span className="mt-2 block text-[11px] tracking-tight text-neutral-300">
      {label}
    </span>
  </div>
);
