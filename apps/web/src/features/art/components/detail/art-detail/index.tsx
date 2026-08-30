"use client";

import { useArtDetailQuery } from "@bookjeok/react-query";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { ArtDetailSkeleton } from "./skeleton";

interface ArtDetailProps {
  artId: string;
}

// 정보 항목 컴포넌트 - 미니멀 텍스트 기반
const InfoItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="py-4 border-b border-stone-100 last:border-b-0">
    <p className="text-xs text-stone-400 tracking-wide uppercase mb-1.5">
      {label}
    </p>
    <div className="text-sm text-stone-700 wrap-break-word">{children}</div>
  </div>
);

export const ArtDetail = ({ artId }: ArtDetailProps) => {
  const t = useTranslations("art.detail");
  const { data: art, isLoading, isError } = useArtDetailQuery(artId);

  if (isLoading) {
    return <ArtDetailSkeleton />;
  }

  if (isError || !art) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-lg font-medium text-stone-600 mb-2">
          {t("not_found.title")}
        </h2>
        <p className="text-sm text-stone-400 font-light">
          {t("not_found.desc")}
        </p>
      </div>
    );
  }

  const introImages = art.styurls?.styurl
    ? Array.isArray(art.styurls.styurl)
      ? art.styurls.styurl
      : [art.styurls.styurl]
    : [];

  const hasSynopsis = !!art.sty;

  return (
    <div className="bg-stone-50 text-stone-900 w-full min-h-screen">
      {/* 히어로 섹션 - 포스터 전체 배경 */}
      <div className="relative min-h-[500px] lg:min-h-[600px] bg-white overflow-hidden">
        {/* 포스터 배경 이미지 */}
        <div className="absolute inset-0 lg:w-2/3">
          <Image
            src={art.poster}
            alt={art.prfnm}
            fill
            className="object-cover object-top"
            priority
          />
        </div>

        {/* PC: 우측으로 페이드되는 그라디언트 오버레이 */}
        <div className="hidden lg:block absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-white" />
        <div className="hidden lg:block absolute inset-0 bg-linear-to-r from-transparent via-transparent to-white" />

        {/* 모바일: 하단 그라디언트 */}
        <div className="lg:hidden absolute inset-0 bg-linear-to-t from-white via-white/50 to-transparent" />

        {/* 콘텐츠 영역 */}
        <div className="relative z-10 w-full mx-auto px-6 md:px-10 h-full">
          <div className="flex flex-col lg:flex-row lg:items-center min-h-[500px] lg:min-h-[600px]">
            {/* 좌측 여백 (포스터 영역) */}
            <div className="hidden lg:block lg:w-1/3" />

            {/* 정보 영역 - 우측 */}
            <div className="flex-1 py-10 lg:py-16 lg:pl-12">
              <div className="max-w-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-medium text-stone-500 tracking-wide">
                    {art.genrenm}
                  </span>
                  <span className="w-px h-3 bg-stone-300" />
                  <span
                    className={`text-xs font-medium tracking-wide ${
                      art.prfstate === "공연중"
                        ? "text-emerald-600"
                        : art.prfstate === "공연예정"
                          ? "text-blue-600"
                          : "text-stone-400"
                    }`}
                  >
                    {art.prfstate}
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-stone-900 wrap-break-word mb-4">
                  {art.prfnm}
                </h1>

                <p className="text-lg text-stone-500 font-light mb-6">
                  {art.fcltynm}
                </p>

                {/* 간략 정보 */}
                <div className="flex items-center gap-6 text-sm text-stone-500 mb-8">
                  <div>
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">
                      {t("period")}
                    </p>
                    <p className="font-medium text-stone-700">
                      {art.prfpdfrom} ~ {art.prfpdto}
                    </p>
                  </div>
                  <span className="w-px h-8 bg-stone-200" />
                  <div>
                    <p className="text-[11px] text-stone-400 uppercase tracking-wide mb-0.5">
                      {t("runtime")}
                    </p>
                    <p className="font-medium text-stone-700">
                      {art.prfruntime}
                    </p>
                  </div>
                </div>

                {/* 예매 링크 */}
                {art.relates?.relate && (
                  <div className="flex flex-wrap gap-3">
                    {(Array.isArray(art.relates.relate)
                      ? art.relates.relate
                      : [art.relates.relate]
                    ).map(
                      (link, i) =>
                        link.relateurl && (
                          <a
                            key={i}
                            href={link.relateurl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-stone-600 font-medium border-b border-stone-300 pb-0.5 hover:text-stone-900 hover:border-stone-900 transition-colors duration-200"
                          >
                            {link.relatenm ||
                              `${t("default_booking")} ${i + 1}`}
                            <span className="text-[10px]">↗</span>
                          </a>
                        ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="w-full mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽 컬럼 */}
        <div className="lg:col-span-2 space-y-10">
          {/* 공연 장면 슬라이더 */}
          {introImages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-6 bg-stone-300" />
                <h2 className="text-sm font-medium text-stone-500 tracking-wide uppercase">
                  {t("scenes")}
                </h2>
              </div>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={12}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                className="overflow-hidden"
              >
                {introImages.map((imgSrc, index) => (
                  <SwiperSlide key={index} className="aspect-video select-none">
                    <a href={imgSrc} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={imgSrc}
                        alt={`${art.prfnm} ${t("scenes")} ${index + 1}`}
                        fill
                        className="object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
                      />
                    </a>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}

          {/* 줄거리 */}
          {hasSynopsis && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-6 bg-stone-300" />
                <h2 className="text-sm font-medium text-stone-500 tracking-wide uppercase">
                  {t("synopsis")}
                </h2>
              </div>
              <p className="text-stone-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                {art.sty}
              </p>
            </div>
          )}
        </div>

        {/* 오른쪽 컬럼 - 상세 정보 */}
        <div>
          <InfoItem label={t("period")}>
            <p className="font-medium">
              {art.prfpdfrom} ~ {art.prfpdto}
            </p>
            <p className="mt-1 text-xs text-stone-400">{art.dtguidance}</p>
          </InfoItem>

          <InfoItem label={t("runtime")}>
            <p className="font-medium">{art.prfruntime}</p>
          </InfoItem>

          <InfoItem label={t("place")}>
            <p className="font-medium">{art.fcltynm}</p>
            <p className="mt-1 text-xs text-stone-400">{art.area}</p>
          </InfoItem>

          <InfoItem label={t("ticket")}>
            <p className="font-medium">{art.pcseguidance}</p>
            <p className="mt-2 text-xs">
              <span className="text-stone-400">{t("age")}:</span>{" "}
              <span className="text-stone-600">{art.prfage}</span>
            </p>
          </InfoItem>

          {(art.prfcast || art.prfcrew) && (
            <InfoItem label={t("cast_crew")}>
              {art.prfcast && (
                <p>
                  <span className="text-stone-400">{t("cast")}:</span>{" "}
                  {art.prfcast}
                </p>
              )}
              {art.prfcrew && (
                <p className="mt-1">
                  <span className="text-stone-400">{t("crew")}:</span>{" "}
                  {art.prfcrew}
                </p>
              )}
            </InfoItem>
          )}
        </div>
      </div>
    </div>
  );
};
