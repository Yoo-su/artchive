"use client";

import { AuthGuard } from "@/features/auth/components/guards/auth-guard";

/**
 * 마이페이지 레이아웃
 *
 * 모든 마이페이지 하위 경로에 인증 가드를 적용합니다.
 * 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트됩니다.
 */
export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
