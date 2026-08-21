import { useEmailLoginMutation } from "@bookjeok/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createLoginSchema, LoginSchemaType } from "@/features/auth/schema"; // Using centralized schema
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { consumeReturnUrl } from "@/features/auth/utils/return-url";
import { Logo } from "@/layouts/common/logo";
import { Button } from "@/shared/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";
import { config } from "@/shared/config/env";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { getErrorMessage } from "@/shared/utils/error-handler";


export const LoginForm = () => {
  const t = useTranslations("auth.login");
  const handleSocialLogin = (callbackUrl: string) => {
    window.location.href = `${config.NEXT_PUBLIC_API_URL}/${callbackUrl}`;
  };

  return (
    <div className="w-full max-w-sm p-8 mx-4 space-y-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <Logo />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <EmailLoginForm />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">{t("or_social")}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {/* 카카오 로그인 버튼 */}
        <button
          onClick={() => handleSocialLogin("auth/kakao")}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] transition-colors rounded-lg font-medium text-[#000000] text-[15px]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0C4.0293 0 0 3.28125 0 7.33125C0 9.87188 1.5457 12.1125 3.9375 13.4062L2.9707 17.1562C2.91445 17.3719 3.07695 17.5688 3.29883 17.5688C3.38672 17.5688 3.47461 17.5406 3.54492 17.4797L7.95117 14.4C8.29688 14.4281 8.64844 14.4469 9 14.4469C13.9707 14.4469 18 11.1656 18 7.11562C18 3.28125 13.9707 0 9 0Z"
              fill="#000000"
            />
          </svg>
          {t("kakao")}
        </button>

        {/* 네이버 로그인 버튼 */}
        <button
          onClick={() => handleSocialLogin("auth/naver")}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[#03C75A] hover:bg-[#02B350] transition-colors rounded-lg font-medium text-white text-[15px]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M12.1575 9.7125L5.5575 0H0V18H5.8425V8.2875L12.4425 18H18V0H12.1575V9.7125Z"
              fill="white"
            />
          </svg>
          {t("naver")}
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-500">{t("no_account")} </span>
        <Link
          href="/signup"
          className="font-medium text-emerald-600 hover:text-emerald-500"
        >
          {t("signup_link")}
        </Link>
      </div>
    </div>
  );
};

function EmailLoginForm() {
  const t = useTranslations("auth.login");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(createLoginSchema((key) => tValidation(key))),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: login, isPending: isLoading } = useEmailLoginMutation({
    onSuccess: (data) => {
      setAuth(data);
      toast.success(t("success"));
      const returnUrl = consumeReturnUrl();
      router.push(returnUrl || "/");
    },
    onError: (error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const message = getErrorMessage(error, "");
        if (message === "SOCIAL_LOGIN_USER") {
          form.setError("root", {
            message: t("error.social_login_user"),
          });
        } else {
          form.setError("root", {
            message: t("error.invalid_credentials"),
          });
        }
      } else {
        toast.error(t("error.general"));
      }
    },
  });

  const onSubmit = (values: LoginSchemaType) => {
    login(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder={t("placeholders.email")}
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder={t("placeholders.password")}
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <div className="text-[13px] font-medium text-destructive text-center">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>
    </Form>
  );
}
