import { upload } from "@vercel/blob/client";

import { compressImages } from "@/shared/utils/compress-image";

interface UploadOptions {
  onProgress?: (percent: number) => void;
  onCompressProgress?: (completed: number, total: number) => void;
}

/**
 * 판매글 생성 시 이미지를 압축하고 Vercel Blob에 업로드하는 서비스입니다.
 *
 * @param imageFiles 업로드할 이미지 파일 배열
 * @param userId 사용자 식별 정보 (provider, id)
 * @param accessToken 인증 토큰
 * @param options 진행 상태 콜백 옵션
 * @returns 업로드된 이미지 URL 배열
 */
export const uploadSaleImages = async (
  imageFiles: File[],
  userId: { provider: string; id: number },
  accessToken: string,
  options?: UploadOptions,
): Promise<string[]> => {
  if (imageFiles.length === 0) return [];

  // 1. 클라이언트 이미지 압축
  options?.onCompressProgress?.(0, imageFiles.length);
  const compressedFiles = await compressImages(imageFiles);
  options?.onCompressProgress?.(compressedFiles.length, imageFiles.length);

  // 2. Vercel Blob 업로드
  const totalFiles = compressedFiles.length;
  const progressMap = new Array<number>(totalFiles).fill(0);

  const updateOverallProgress = () => {
    const totalPercent = progressMap.reduce((acc, curr) => acc + curr, 0);
    const averagePercent = Math.round(totalPercent / totalFiles);
    options?.onProgress?.(averagePercent);
  };

  const blobs = await Promise.all(
    compressedFiles.map((file, index) => {
      const filePath = `${userId.provider}-${userId.id}/sales-images/${file.name}`;
      return upload(filePath, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: JSON.stringify({ token: accessToken }),
        onUploadProgress: (progressEvent) => {
          progressMap[index] = progressEvent.percentage;
          updateOverallProgress();
        },
      });
    }),
  );

  return blobs.map((blob) => blob.url);
};
