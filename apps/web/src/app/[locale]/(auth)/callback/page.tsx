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

    if (accessToken && refreshToken && userString) {
      try {
        const user: User = JSON.parse(userString);
        setTokens({ accessToken, refreshToken });
        setUser(user);
        const returnUrl = consumeReturnUrl();
        router.replace(returnUrl || PATHS.HOME);
      } catch (error) {
        console.error("Failed to parse user data:", error);
        router.replace(PATHS.LOGIN);
      }
    } else {
      router.replace(PATHS.LOGIN);
    }
  }, [router, searchParams, setTokens, setUser]);

  return null;
}
