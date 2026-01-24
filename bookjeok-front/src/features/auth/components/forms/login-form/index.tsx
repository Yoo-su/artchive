import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { emailLogin } from "@/features/auth/apis";
import { LoginSchema, LoginSchemaType } from "@/features/auth/schema"; // Using centralized schema
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
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

export const LoginForm = () => {
  const handleSocialLogin = (callbackUrl: string) => {
    window.location.href = `${config.NEXT_PUBLIC_API_URL}/${callbackUrl}`;
  };

  return (
    <div className="w-full max-w-sm p-8 mx-4 space-y-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <Logo />
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          로그인
        </h1>
        <p className="text-sm text-gray-500">
          북적 서비스 이용을 위해 로그인해주세요.
        </p>
      </div>

      <EmailLoginForm />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">
            또는 소셜 계정으로 로그인
          </span>
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
          카카오 로그인
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
          네이버 로그인
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-500">계정이 없으신가요? </span>
        <Link
          href="/signup"
          className="font-medium text-emerald-600 hover:text-emerald-500"
        >
          이메일로 회원가입
        </Link>
      </div>
    </div>
  );
};

function EmailLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginSchemaType) => {
    try {
      setIsLoading(true);
      const data = await emailLogin(values);
      setAuth(data);
      toast.success("로그인되었습니다.");
      router.push("/");
    } catch (error: any) {
      if (error.response?.status === 401) {
        form.setError("root", {
          message: "이메일 또는 비밀번호가 일치하지 않습니다.",
        });
      } else {
        toast.error("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
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
                <Input placeholder="이메일" type="email" {...field} />
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
                <Input placeholder="비밀번호" type="password" {...field} />
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
          이메일로 로그인
        </Button>
      </form>
    </Form>
  );
}
