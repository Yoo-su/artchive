"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { emailSignup } from "@/features/auth/apis";
import { SignupSchema, SignupSchemaType } from "@/features/auth/schema";
import { Button } from "@/shared/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Input } from "@/shared/components/shadcn/input";

export const SignupForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      nickname: "",
    },
  });

  const onSubmit = async (values: SignupSchemaType) => {
    try {
      setIsLoading(true);
      await emailSignup({
        email: values.email,
        password: values.password,
        nickname: values.nickname,
      });

      toast.success("가입이 완료되었습니다! 로그인해주세요.");
      router.push("/login");
    } catch (error: any) {
      if (error.response?.status === 409) {
        const message = error.response.data.message;
        if (message === "EMAIL_ALREADY_EXISTS") {
          form.setError("email", { message: "이미 사용 중인 이메일입니다." });
        } else if (message === "NICKNAME_ALREADY_EXISTS") {
          form.setError("nickname", {
            message: "이미 사용 중인 닉네임입니다.",
          });
        } else {
          toast.error("이미 사용 중인 정보입니다.");
        }
      } else {
        const serverMessage = error.response?.data?.message;
        if (serverMessage) {
          toast.error(`오류: ${serverMessage}`);
        } else {
          toast.error(
            "회원가입 중 알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          회원가입
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          북적 서비스 이용을 위해 필수 정보를 입력해주세요.
        </p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-gray-700 font-medium">
                    이메일
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@email.com"
                      type="email"
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <div className="min-h-[20px]">
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      비밀번호
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="8자 이상, 영문/숫자/특수문자"
                        type="password"
                        className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-gray-700 font-medium">
                      비밀번호 확인
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="비밀번호 확인"
                        type="password"
                        className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <div className="min-h-[20px]">
                      <FormMessage className="text-xs" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-gray-700 font-medium">
                    닉네임
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="사용할 닉네임"
                      className="h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <div className="min-h-[20px]">
                    <FormMessage className="text-xs" />
                  </div>
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                가입하기
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">이미 계정이 있으신가요? </span>
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
};
