"use client";

import { useVerifyEmailMutation } from "@bookjeok/react-query";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Logo } from "@/layouts/common/logo";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export const VerifyEmailView = () => {
  const t = useTranslations("auth.verification");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const verifiedRef = useRef(false);

  const { mutate: verify } = useVerifyEmailMutation({
    onSuccess: (data) => {
      setStatus("success");
      // 현재 로그인된 사용자의 인증 상태 실시간 업데이트
      if (user) {
        setUser({
          ...user,
          isEmailVerified: true,
        });
      }
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(t("error_desc"));
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("error_desc"));
      return;
    }

    if (!verifiedRef.current) {
      verifiedRef.current = true;
      verify(token);
    }
  }, [token, verify, t]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200/90 bg-white p-8 shadow-xs text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {status === "loading" && (
          <div className="space-y-4 py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-700">
              <Loader2 className="h-7 w-7 animate-spin text-stone-600" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              {t("title")}
            </h1>
            <p className="text-sm text-stone-500">{t("verifying")}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              {t("success_title")}
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t("success_desc")}
            </p>

            <div className="pt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                asChild
                className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 text-sm font-medium"
              >
                <Link href={PATHS.MY_PAGE}>{t("btn_mypage")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl h-11 text-sm font-medium"
              >
                <Link href="/">{t("btn_home")}</Link>
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="h-8 w-8 text-rose-600" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">
              {t("error_title")}
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              {errorMessage || t("error_desc")}
            </p>

            <div className="pt-6 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                asChild
                className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-xl h-11 text-sm font-medium"
              >
                <Link href={PATHS.LOGIN}>{t("btn_login")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl h-11 text-sm font-medium"
              >
                <Link href="/">{t("btn_home")}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
