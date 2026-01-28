import "@/styles/globals.css";
import "@/styles/swiper.css";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

import { ChatProvider } from "@/features/chat/providers/chat-provider";
import { NotificationProvider } from "@/features/notification/providers/notification-provider";
import { Toaster } from "@/shared/components/shadcn/sonner";
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

export { metadata } from "@/shared/config/metadata";
import { config } from "@/shared/config/env";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${nanum_gothic.variable} ${bitcount.variable} ${gowun_batang.variable}`}
    >
      <body style={{ fontFamily: "var(--font-pretendard)" }}>
        <QueryProvider>
          <UserProvider>
            {/* Notification System */}
            <SocketProvider namespace="/notification">
              <NotificationProvider />
            </SocketProvider>

            {/* Chat System (Nested or Parallel - Sibling works because listeners are inside respective providers) */}
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
      </body>
    </html>
  );
}
