import "@/styles/globals.css";
import "@/styles/swiper.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { ChatProvider } from "@/features/chat/providers/chat-provider";
import { NotificationProvider } from "@/features/notification/providers/notification-provider";
import { Toaster } from "@/shared/components/shadcn/sonner";
import { config } from "@/shared/config/env";
import { routing } from "@/shared/config/i18n/routing";
import { jsonLd } from "@/shared/config/json-ld";
import { QueryProvider } from "@/shared/providers/query-provider";
import { SocketProvider } from "@/shared/providers/socket-provider";
import UserProvider from "@/shared/providers/user-provider";
import {
  bitcount,
  gowun_batang,
  nanum_gothic,
  pretendard,
} from "@/styles/fonts";

// 메타데이터는 src/shared/config/metadata.ts에서 관리됩니다.
export { metadata } from "@/shared/config/metadata";

export default async function Layout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // 들어오는 `locale`이 유효한지 확인합니다.
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // 모든 메시지를 클라이언트에 제공하는 것이
  // 시작하기에 가장 쉬운 방법입니다.
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${pretendard.variable} ${nanum_gothic.variable} ${bitcount.variable} ${gowun_batang.variable}`}
    >
      <body style={{ fontFamily: "var(--font-pretendard)" }}>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <UserProvider>
              {/* 알림 시스템 */}
              <SocketProvider namespace="/notification">
                <NotificationProvider />
              </SocketProvider>

              {/* 채팅 시스템 (중첩 또는 병렬 - 리스너가 각 제공자 내부에 있으므로 형제 관계도 작동함) */}
              <SocketProvider namespace="/chat">
                <ChatProvider>{children}</ChatProvider>
              </SocketProvider>
            </UserProvider>

            <Analytics />
            <SpeedInsights />
          </QueryProvider>
          <Toaster position="bottom-center" />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {config.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
            <Script
              id="adsense-init"
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
