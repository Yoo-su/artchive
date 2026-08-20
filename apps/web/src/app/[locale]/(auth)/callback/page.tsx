"use client";

import { exchangeAuthTicket } from "@bookjeok/api-client";
import { User } from "@bookjeok/core";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { consumeReturnUrl } from "@/features/auth/utils/return-url";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      const ticket = searchParams.get("ticket");
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const userString = searchParams.get("user");

      // 1. 보안 권장 방식: 1회용 인증 티켓 교환
      if (ticket) {
        try {
          const data = await exchangeAuthTicket(ticket);
          setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          if (data.user) {
            setUser(data.user as User);
          }
          const returnUrl = consumeReturnUrl();
          router.replace(returnUrl || PATHS.HOME);
          return;
        } catch (error) {
          console.error("Failed to exchange auth ticket:", error);
          router.replace(PATHS.LOGIN);
          return;
        }
      }

      // 2. 하위 호환성 폴백: 레거시 직접 전달 파라미터 처리
      if (accessToken && refreshToken) {
        try {
          setTokens({ accessToken, refreshToken });
          if (userString) {
            try {
              const user: User = JSON.parse(userString);
              setUser(user);
            } catch (e) {
              console.warn(
                "Could not parse user from query, UserProvider will fetch profile:",
                e,
              );
            }
          }
          const returnUrl = consumeReturnUrl();
          router.replace(returnUrl || PATHS.HOME);
        } catch (error) {
          console.error("Failed to process legacy auth callback:", error);
          router.replace(PATHS.LOGIN);
        }
      } else {
        router.replace(PATHS.LOGIN);
      }
    };

    void handleAuth();
  }, [router, searchParams, setTokens, setUser]);

  return null;
}


export default function Page() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
