"use client";

import { useBookSaleForEditQuery } from "@bookjeok/react-query";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { AlertTriangle, Loader2 } from "@/shared/components/icons/iconsax";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { BookSaleEditForm } from "../book-sale-edit-form";

interface BookSaleEditProps {
  saleId: string;
}

export const BookSaleEdit = ({ saleId }: BookSaleEditProps) => {
  const t = useTranslations("market.form");
  const router = useRouter();
  const {
    data: sale,
    isLoading,
    isError,
    error,
  } = useBookSaleForEditQuery(saleId);

  // 403 에러 처리 (권한 없음)
  useEffect(() => {
    if (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 403) {
        toast.error(t("unauthorized"));
        router.replace(PATHS.MY_PAGE_SALES);
      }
    }
  }, [error, router, t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <div className="py-20 text-center text-red-500">
        <AlertTriangle className="mx-auto h-12 w-12" />
        <p className="mt-4 font-semibold">{t("fetch_error")}</p>
      </div>
    );
  }

  return <BookSaleEditForm sale={sale} />;
};
