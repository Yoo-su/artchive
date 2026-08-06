import { privateApiClient } from "@bookjeok/api-client";
import {
  bookSaleKeys,
  CreateBookSaleParams,
  UpdateBookSaleParams,
  UsedBookSale,
} from "@bookjeok/core";
import {
  useCreateBookSaleMutation as useSharedCreateBookSaleMutation,
  useDeleteBookSaleMutation as useSharedDeleteBookSaleMutation,
  useUpdateBookSaleMutation as useSharedUpdateBookSaleMutation,
  useUpdateBookSaleStatusMutation as useSharedUpdateBookSaleStatusMutation,
} from "@bookjeok/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { PATHS } from "@/shared/constants/paths";
import { compressImages } from "@/shared/utils/compress-image";
import { handleMutationError } from "@/shared/utils/error-handler";

import { deleteImages } from "../actions/delete-action";
import { uploadImages } from "../actions/upload-action";
import { uploadSaleImages } from "../services/image-upload-service";

interface CreateSaleVariables {
  imageFiles: File[];
  payload: Omit<CreateBookSaleParams, "imageUrls">;
  idempotencyKey?: string;
  onProgressState?: (
    step: "compressing" | "uploading" | "submitting",
    percent: number,
  ) => void;
}

/**
 * 이미지 업로드 전 만료된 AccessToken을 미리 Refresh하는 헬퍼 함수
 */
const ensureFreshAuthToken = async () => {
  await privateApiClient.get("/user/profile");
  const authState = useAuthStore.getState();
  if (!authState.user || !authState.accessToken) {
    throw new Error("로그인이 필요한 서비스입니다.");
  }
  return {
    user: authState.user,
    accessToken: authState.accessToken,
  };
};

/**
 * 중고책 판매글을 생성하는 뮤테이션 훅입니다.
 */
export const useCreateBookSaleMutation = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const sharedMutation = useSharedCreateBookSaleMutation({
    onSuccess: () => {
      toast.success("판매글이 성공적으로 등록되었습니다.");
      queryClient.invalidateQueries({ queryKey: bookSaleKeys.availableRegions.queryKey });
      router.push(PATHS.MY_PAGE_SALES);
    },
    onError: (error: Error) => {
      handleMutationError(error, "판매글 등록");
    },
  });

  const processCreate = async ({
    imageFiles,
    payload,
    idempotencyKey,
    onProgressState,
  }: CreateSaleVariables) => {
    onProgressState?.("compressing", 10);
    const { user, accessToken } = await ensureFreshAuthToken();

    onProgressState?.("uploading", 25);
    const imageUrls = await uploadSaleImages(
      imageFiles,
      { provider: user.provider, id: user.id },
      accessToken,
      {
        onCompressProgress: () => onProgressState?.("compressing", 20),
        onProgress: (percent) =>
          onProgressState?.("uploading", Math.min(85, 25 + Math.round(percent * 0.6))),
      },
    );

    onProgressState?.("submitting", 90);
    const finalPayload = { ...payload, imageUrls };
    return { finalPayload, idempotencyKey };
  };

  return {
    ...sharedMutation,
    mutate: async (variables: CreateSaleVariables) => {
      const { finalPayload, idempotencyKey } = await processCreate(variables);
      return sharedMutation.mutate({
        ...finalPayload,
        idempotencyKey,
      } as CreateBookSaleParams & { idempotencyKey?: string });
    },
    mutateAsync: async (variables: CreateSaleVariables) => {
      const { finalPayload, idempotencyKey } = await processCreate(variables);
      return sharedMutation.mutateAsync({
        ...finalPayload,
        idempotencyKey,
      } as CreateBookSaleParams & { idempotencyKey?: string });
    },
  };
};

/**
 * 판매글 상태를 업데이트하는 뮤테이션 훅입니다.
 */
export const useUpdateBookSaleStatusMutation = () => {
  return useSharedUpdateBookSaleStatusMutation();
};

/**
 * 중고책 판매글 수정을 위한 뮤테이션 훅입니다.
 */
interface UpdateSaleVariables {
  saleId: number;
  payload: UpdateBookSaleParams;
  newImageFiles?: File[];
  deletedImageUrls?: string[];
  onProgressState?: (
    step: "compressing" | "uploading" | "submitting",
    percent: number,
  ) => void;
}

export const useUpdateBookSaleMutation = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const sharedMutation = useSharedUpdateBookSaleMutation({
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

  const processUpdate = async ({
    saleId,
    payload,
    newImageFiles = [],
    deletedImageUrls = [],
    onProgressState,
  }: UpdateSaleVariables) => {
    onProgressState?.("compressing", 15);
    const { user, accessToken } = await ensureFreshAuthToken();

    if (deletedImageUrls.length > 0) {
      await deleteImages(deletedImageUrls);
    }

    let newImageUrls: string[] = [];
    if (newImageFiles.length > 0) {
      onProgressState?.("uploading", 30);
      newImageUrls = await uploadSaleImages(
        newImageFiles,
        { provider: user.provider, id: user.id },
        accessToken,
        {
          onProgress: (p) =>
            onProgressState?.("uploading", Math.min(85, 30 + Math.round(p * 0.55))),
        },
      );
    }

    onProgressState?.("submitting", 90);
    const finalImageUrls = [...(payload.imageUrls || []), ...newImageUrls];
    const finalPayload = { ...payload, imageUrls: finalImageUrls };

    return { saleId, payload: finalPayload };
  };

  return {
    ...sharedMutation,
    mutate: async (variables: UpdateSaleVariables) => {
      const params = await processUpdate(variables);
      return sharedMutation.mutate(params);
    },
    mutateAsync: async (variables: UpdateSaleVariables) => {
      const params = await processUpdate(variables);
      return sharedMutation.mutateAsync(params);
    },
  };
};

/**
 * 중고책 판매글 삭제를 위한 뮤테이션 훅입니다.
 */
export const useDeleteBookSaleMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const sharedMutation = useSharedDeleteBookSaleMutation({
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
    mutate: async ({
      saleId,
      imageUrls,
    }: {
      saleId: number;
      imageUrls: string[];
    }) => {
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      return sharedMutation.mutate(saleId, {
        onSuccess: () => {
          if (
            typeof window !== "undefined" &&
            window.location.pathname.includes(`/book/sales/${saleId}`)
          ) {
            router.push(PATHS.MY_PAGE_SALES);
          }
        },
      });
    },
    mutateAsync: async ({
      saleId,
      imageUrls,
    }: {
      saleId: number;
      imageUrls: string[];
    }) => {
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      return sharedMutation.mutateAsync(saleId).then((res: void) => {
        if (
          typeof window !== "undefined" &&
          window.location.pathname.includes(`/book/sales/${saleId}`)
        ) {
          router.push(PATHS.MY_PAGE_SALES);
        }
        return res;
      });
    },
  };
};
