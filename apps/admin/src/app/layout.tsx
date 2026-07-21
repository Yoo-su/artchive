import "./globals.css";
import "@/libs/api";

import type { Metadata } from "next";
import { Gowun_Dodum } from "next/font/google";

const gowunDodum = Gowun_Dodum({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "북적 어드민",
  description: "북적 서비스 관리자 페이지",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${gowunDodum.className} antialiased min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50`}>
        {children}
      </body>
    </html>
  );
}
