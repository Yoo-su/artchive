import { CreateBookSaleParams, UpdateBookSaleParams, UsedBookSale } from "@bookjeok/core/book-sale";
import { bookSaleKeys, useCreateBookSaleMutation as useSharedCreateBookSaleMutation, useDeleteBookSaleMutation as useSharedDeleteBookSaleMutation, useUpdateBookSaleMutation as useSharedUpdateBookSaleMutation, useUpdateBookSaleStatusMutation as useSharedUpdateBookSaleStatusMutation } from "@bookjeok/react-query/book-sale";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { PATHS } from "@/shared/constants/paths";
import { privateAxios } from "@/shared/libs/axios";
import { compressImages } from "@/shared/utils/compress-image";
import { handleMutationError } from "@/shared/utils/error-handler";

import { deleteImages } from "../actions/delete-action";
import { uploadImages } from "../actions/upload-action";
import { uploadSaleImages } from "../services/image-upload-service";

interface CreateSaleVariables {
  imageFiles: File[];
  payload: Omit<CreateBookSaleParams, "imageUrls">;
}

/**
 * 중고책 판매글을 생성하는 뮤테이션 훅입니다.
 */
export const useCreateBookSaleMutation = () => {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const sharedMutation = useSharedCreateBookSaleMutation(privateAxios, {
    onSuccess: () => {
      toast.success("판매글이 성공적으로 등록되었습니다.");
      router.push(PATHS.MY_PAGE_SALES);
    },
    onError: (error: Error) => {
      handleMutationError(error, "판매글 등록");
    },
  });

  return {
    ...sharedMutation,
    mutate: async ({ imageFiles, payload }: CreateSaleVariables) => {
      if (!authUser) throw new Error("인증 정보가 없습니다.");
      const imageUrls = await uploadSaleImages(
        imageFiles,
        { provider: authUser.provider, id: authUser.id },
        accessToken!,
      );

      const finalPayload = { ...payload, imageUrls };
      return sharedMutation.mutate(finalPayload);
    },
    mutateAsync: async ({ imageFiles, payload }: CreateSaleVariables) => {
      if (!authUser) throw new Error("인증 정보가 없습니다.");
      const imageUrls = await uploadSaleImages(
        imageFiles,
        { provider: authUser.provider, id: authUser.id },
        accessToken!,
      );

      const finalPayload = { ...payload, imageUrls };
      return sharedMutation.mutateAsync(finalPayload);
    },
  };
};

/**
 * 판매글 상태를 업데이트하는 뮤테이션 훅입니다.
 */
export const useUpdateBookSaleStatusMutation = () => {
  return useSharedUpdateBookSaleStatusMutation(privateAxios);
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
  const authUser = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  const sharedMutation = useSharedUpdateBookSaleMutation(privateAxios, {
    onSuccess: (data: UsedBookSale) => {
      toast.success("판매글이 성공적으로 수정되었습니다.");
      queryClient.invalidateQueries({
        queryKey: bookSaleKeys.mySales.queryKey,
      });
      queryClient.invalidateQueries({
        queryKey: bookSaleKeys.saleDetail(String(data.id)).queryKey,
      });
      router.push(PATHS.MY_PAGE_SALES);
    },
    onError: (error: Error) => {
      handleMutationError(error, "판매글 수정");
    },
  });

  return {
    ...sharedMutation,
    mutate: async ({
      saleId,
      payload,
      newImageFiles = [],
      deletedImageUrls = [],
    }: UpdateSaleVariables) => {
      if (!authUser || !accessToken) throw new Error("인증 정보가 없습니다.");
      
      if (deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }

      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const compressedFiles = await compressImages(newImageFiles);
        const formData = new FormData();
        compressedFiles.forEach((file) => formData.append("images", file));
        
        const uploadResult = await uploadImages(
          formData,
          authUser.provider,
          authUser.id,
          accessToken,
        );
        if (!uploadResult.success || !uploadResult.blobs) {
          throw new Error("새 이미지 업로드에 실패했습니다.");
        }
        newImageUrls = uploadResult.blobs.map((blob) => blob.url);
      }

      const finalImageUrls = [...(payload.imageUrls || []), ...newImageUrls];
      const finalPayload = { ...payload, imageUrls: finalImageUrls };

      return sharedMutation.mutate({ saleId, payload: finalPayload });
    },
    mutateAsync: async ({
      saleId,
      payload,
      newImageFiles = [],
      deletedImageUrls = [],
    }: UpdateSaleVariables) => {
      if (!authUser || !accessToken) throw new Error("인증 정보가 없습니다.");

      if (deletedImageUrls.length > 0) {
        await deleteImages(deletedImageUrls);
      }

      let newImageUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const compressedFiles = await compressImages(newImageFiles);
        const formData = new FormData();
        compressedFiles.forEach((file) => formData.append("images", file));
        
        const uploadResult = await uploadImages(
          formData,
          authUser.provider,
          authUser.id,
          accessToken,
        );
        if (!uploadResult.success || !uploadResult.blobs) {
          throw new Error("새 이미지 업로드에 실패했습니다.");
        }
        newImageUrls = uploadResult.blobs.map((blob) => blob.url);
      }

      const finalImageUrls = [...(payload.imageUrls || []), ...newImageUrls];
      const finalPayload = { ...payload, imageUrls: finalImageUrls };

      return sharedMutation.mutateAsync({ saleId, payload: finalPayload });
    },
  };
};

/**
 * 중고책 판매글 삭제를 위한 뮤테이션 훅입니다.
 */
export const useDeleteBookSaleMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const sharedMutation = useSharedDeleteBookSaleMutation(privateAxios, {
    onSuccess: () => {
      toast.success("판매글이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: bookSaleKeys._def });
    },
    onError: (error: Error) => {
      handleMutationError(error, "판매글 삭제");
    },
  });

  return {
    ...sharedMutation,
    mutate: async ({ saleId, imageUrls }: { saleId: number; imageUrls: string[] }) => {
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      return sharedMutation.mutate(saleId, {
        onSuccess: () => {
          if (typeof window !== "undefined" && window.location.pathname.includes(`/book/sales/${saleId}`)) {
            router.push(PATHS.MY_PAGE_SALES);
          }
        }
      });
    },
    mutateAsync: async ({ saleId, imageUrls }: { saleId: number; imageUrls: string[] }) => {
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      return sharedMutation.mutateAsync(saleId).then((res: void) => {
        if (typeof window !== "undefined" && window.location.pathname.includes(`/book/sales/${saleId}`)) {
          router.push(PATHS.MY_PAGE_SALES);
        }
        return res;
      });
    },
  };
};
