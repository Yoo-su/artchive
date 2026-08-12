"use client";

import { User } from "@bookjeok/core";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { consumeReturnUrl } from "@/features/auth/utils/return-url";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, setUser } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const userString = searchParams.get("user");

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
        console.error("Failed to process auth callback:", error);
        router.replace(PATHS.LOGIN);
      }
    } else {
      router.replace(PATHS.LOGIN);
    }
  }, [router, searchParams, setTokens, setUser]);

  return null;
}
