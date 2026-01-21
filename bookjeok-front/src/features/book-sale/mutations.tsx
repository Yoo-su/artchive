"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { PATHS } from "@/shared/constants/paths";
import { QUERY_KEYS } from "@/shared/constants/query-keys";
import { compressImages } from "@/shared/utils/compress-image";

import { deleteImages } from "./actions/delete-action";
import { uploadImages } from "./actions/upload-action";
import {
  createBookSale,
  deleteBookSale,
  updateBookSale,
  updateBookSaleStatus,
} from "./apis";
import {
  CreateBookSaleParams,
  UpdateBookSaleParams,
  UsedBookSale,
} from "./types";

interface CreateSaleVariables {
  imageFiles: File[];
  payload: Omit<CreateBookSaleParams, "imageUrls">;
}

/**
 * 중고책 판매글을 생성하는 뮤테이션 훅입니다.
 */
export const useCreateBookSaleMutation = () => {
  const router = useRouter();
  const { provider, id } = useAuthStore((state) => state.user)!;
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation<UsedBookSale, Error, CreateSaleVariables>({
    mutationFn: async ({ imageFiles, payload }) => {
      const compressedFiles = await compressImages(imageFiles);

      const blobs = await Promise.all(
        compressedFiles.map((file) => {
          const filePath = `${provider}-${id}/sales-images/${file.name}`;
          return upload(filePath, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
            clientPayload: JSON.stringify({
              token: accessToken,
            }),
          });
        }),
      );
      const imageUrls = blobs.map((blob) => blob.url);

      const finalPayload = { ...payload, imageUrls };
      const saleResult = await createBookSale(finalPayload);

      if (!saleResult.success) {
        throw new Error("게시글 등록에 실패했습니다.");
      }
      return saleResult;
    },
    onSuccess: () => {
      toast.success("판매글이 성공적으로 등록되었습니다.");
      router.push(PATHS.MY_PAGE_SALES);
    },
    onError: (error) => {
      console.error("Submission failed:", error);
      toast.error(error.message || "오류가 발생했습니다. 다시 시도해주세요.");
    },
  });
};

/**
 * 판매글 상태를 업데이트하는 뮤테이션 훅입니다. (낙관적 업데이트 적용)
 */
export const useUpdateBookSaleStatusMutation = () => {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.bookKeys.mySales.queryKey;

  return useMutation({
    mutationFn: updateBookSaleStatus,
    onMutate: async ({ saleId, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSales = queryClient.getQueryData<UsedBookSale[]>(queryKey);

      queryClient.setQueryData<UsedBookSale[]>(queryKey, (old) =>
        old
          ? old.map((sale) =>
              sale.id === saleId ? { ...sale, status: status as any } : sale,
            )
          : [],
      );

      return { previousSales };
    },
    onError: (err, variables, context) => {
      if (context?.previousSales) {
        queryClient.setQueryData(queryKey, context.previousSales);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookKeys._def });
    },
  });
};

/**
 * 중고책 판매글 수정을 위한 뮤테이션 훅입니다.
 */
interface UpdateSaleVariables {
  saleId: number;
  payload: UpdateBookSaleParams;
  newImageFiles?: File[];
  deletedImageUrls?: string[];
}

export const useUpdateBookSaleMutation = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { provider, id } = useAuthStore((state) => state.user)!;
  const accessToken = useAuthStore((state) => state.accessToken);

  return useMutation<UsedBookSale, Error, UpdateSaleVariables>({
    mutationFn: async ({
      saleId,
      payload,
      newImageFiles = [],
      deletedImageUrls = [],
    }) => {
      if (deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }

      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const compressedFiles = await compressImages(newImageFiles);

        const formData = new FormData();
        compressedFiles.forEach((file) => formData.append("images", file));
        if (!accessToken) {
          throw new Error("인증 정보가 없습니다.");
        }
        const uploadResult = await uploadImages(
          formData,
          provider,
          id,
          accessToken,
        );
        if (!uploadResult.success || !uploadResult.blobs) {
          throw new Error("새 이미지 업로드에 실패했습니다.");
        }
        newImageUrls = uploadResult.blobs.map((blob) => blob.url);
      }

      const finalImageUrls = [...(payload.imageUrls || []), ...newImageUrls];
      const finalPayload = { ...payload, imageUrls: finalImageUrls };

      const result = await updateBookSale({ saleId, payload: finalPayload });
      if (!result.success) {
        throw new Error("게시글 정보 업데이트에 실패했습니다.");
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success("판매글이 성공적으로 수정되었습니다.");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bookKeys.mySales.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.bookKeys.saleDetail(String(data.id)).queryKey,
      });
      router.push(PATHS.MY_PAGE_SALES);
    },
    onError: (error) => {
      toast.error(`수정 중 오류가 발생했습니다: ${error.message}`);
    },
  });
};

/**
 * 중고책 판매글 삭제를 위한 뮤테이션 훅입니다.
 */
export const useDeleteBookSaleMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<void, Error, { saleId: number; imageUrls: string[] }>({
    mutationFn: async ({ saleId, imageUrls }) => {
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      await deleteBookSale(saleId);
    },
    onSuccess: (_, { saleId }) => {
      toast.success("판매글이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bookKeys._def });
      if (window.location.pathname.includes(`/book/sales/${saleId}`)) {
        router.push(PATHS.MY_PAGE_SALES);
      }
    },
    onError: (error) => {
      toast.error(`삭제 중 오류가 발생했습니다: ${error.message}`);
    },
  });
};
