"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdBannerProps {
  className?: string;
  style?: React.CSSProperties;
  dataAdSlot: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
}

export const AdBanner = ({
  className,
  style,
  dataAdSlot,
  dataAdFormat = "auto",
  dataFullWidthResponsive = true,
}: AdBannerProps) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID) {
    return null;
  }

  // UX 개선: 광고 로딩 전 레이아웃 시프트(CLS) 방지를 위한 최소 높이 설정
  // 모바일에서는 보통 높이가 작으므로 min-h-[100px], 데스크탑은 min-h-[250px] 정도가 적당함
  // 배경색을 연하게 주어 "광고 영역"임을 인지하게 하여 갑자기 콘텐츠가 밀리는 느낌을 줄임
  return (
    <div
      className={`min-h-[100px] sm:min-h-[200px] bg-gray-50 flex justify-center items-center ${className}`}
      style={{ overflow: "hidden", ...style }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
};
