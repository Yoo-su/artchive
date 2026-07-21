"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { emailSignup } from "@/features/auth/apis";
import { createSignupSchema, SignupSchemaType } from "@/features/auth/schema";
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
import { Link, useRouter } from "@/shared/config/i18n/routing";

export const SignupForm = () => {
  const t = useTranslations("auth.signup");
  const tValidation = useTranslations("auth.validation");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(createSignupSchema((key) => tValidation(key))),
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

      toast.success(t("success"));
      router.push("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const message = error.response.data.message;
        if (message === "EMAIL_ALREADY_EXISTS") {
          form.setError("email", { message: t("error.email_exists") });
        } else if (message === "NICKNAME_ALREADY_EXISTS") {
          form.setError("nickname", {
            message: t("error.nickname_exists"),
          });
        } else {
          toast.error(t("error.info_exists"));
        }
      } else if (axios.isAxiosError(error)) {
        const serverMessage = error.response?.data?.message;
        if (serverMessage) {
          toast.error(`오류: ${serverMessage}`);
        } else {
          toast.error(t("error.unknown"));
        }
      } else {
        toast.error(t("error.unknown"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{t("subtitle")}</p>
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
                    {t("labels.email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.email")}
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
                      {t("labels.password")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.password")}
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
                      {t("labels.password_confirm")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placeholders.password_confirm")}
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
                    {t("labels.nickname")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.nickname")}
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
                {t("submit")}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-500">{t("has_account")} </span>
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:text-emerald-500"
          >
            {t("login_link")}
          </Link>
        </div>
      </div>
    </div>
  );
};
