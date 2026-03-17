import { upload } from "@vercel/blob/client";

import { compressImages } from "@/shared/utils/compress-image";

/**
 * 판매글 생성 시 이미지를 압축하고 Vercel Blob에 업로드하는 서비스입니다.
 *
 * @param imageFiles 업로드할 이미지 파일 배열
 * @param userId 사용자 식별 정보 (provider, id)
 * @param accessToken 인증 토큰
 * @returns 업로드된 이미지 URL 배열
 */
export const uploadSaleImages = async (
  imageFiles: File[],
  userId: { provider: string; id: number },
  accessToken: string,
): Promise<string[]> => {
  const compressedFiles = await compressImages(imageFiles);

  const blobs = await Promise.all(
    compressedFiles.map((file) => {
      const filePath = `${userId.provider}-${userId.id}/sales-images/${file.name}`;
      return upload(filePath, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ token: accessToken }),
      });
    }),
  );

  return blobs.map((blob) => blob.url);
};
