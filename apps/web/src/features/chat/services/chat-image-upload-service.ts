import { upload } from "@vercel/blob/client";

import { compressImages } from "@/shared/utils/compress-image";

interface UploadOptions {
  onProgress?: (percent: number) => void;
}

/**
 * 채팅 메시지에 첨부할 이미지를 압축하고 Vercel Blob에 업로드합니다.
 *
 * 업로드 경로는 `{provider}-{userId}/chat-images/{roomId}/{파일명}` 형태이며,
 * 서버(`/api/upload`)에서 접두사 소유권과 카테고리를 검증합니다.
 *
 * @param imageFiles 업로드할 이미지 파일 배열
 * @param userId 사용자 식별 정보 (provider, id)
 * @param roomId 채팅방 ID
 * @param accessToken 인증 토큰
 * @param options 진행 상태 콜백 옵션
 * @returns 업로드된 이미지 URL 배열
 */
export const uploadChatImages = async (
  imageFiles: File[],
  userId: { provider: string; id: number },
  roomId: number,
  accessToken: string,
  options?: UploadOptions,
): Promise<string[]> => {
  if (imageFiles.length === 0) return [];

  // 압축 시 UUID 파일명이 자동 생성되어 경로 충돌을 방지합니다.
  const compressedFiles = await compressImages(imageFiles);

  const totalFiles = compressedFiles.length;
  const progressMap = new Array<number>(totalFiles).fill(0);

  const updateOverallProgress = () => {
    const totalPercent = progressMap.reduce((acc, curr) => acc + curr, 0);
    options?.onProgress?.(Math.round(totalPercent / totalFiles));
  };

  const blobs = await Promise.all(
    compressedFiles.map((file, index) => {
      const filePath = `${userId.provider}-${userId.id}/chat-images/${roomId}/${file.name}`;
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
