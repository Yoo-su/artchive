"use client";

import { AxiosError } from "axios";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { BookSaleEditForm } from "@/features/book/components/book-sale-edit-form";
import { useBookSaleForEditQuery } from "@/features/book/queries";
import { PATHS } from "@/shared/constants/paths";

interface BookSaleEditProps {
  saleId: string;
}

export const BookSaleEdit = ({ saleId }: BookSaleEditProps) => {
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
        toast.error("수정 권한이 없습니다.");
        router.replace(PATHS.MY_PAGE_SALES);
      }
    }
  }, [error, router]);

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
        <p className="mt-4 font-semibold">게시글 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return <BookSaleEditForm sale={sale} />;
};
