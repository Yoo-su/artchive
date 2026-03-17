"use server";

import { put } from "@vercel/blob";
import { z } from "zod";

import { MAX_UPLOAD_SIZE } from "@/shared/utils/compress-image";

// 허용되는 이미지 타입
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ImageSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "이미지 파일이 필요합니다.")
  .refine(
    (file) => file.size <= MAX_UPLOAD_SIZE,
    "이미지 크기는 10MB를 초과할 수 없습니다.",
  )
  .refine(
    (file) => ALLOWED_IMAGE_TYPES.includes(file.type),
    "지원되지 않는 이미지 형식입니다.",
  );

export async function uploadImages(
  formData: FormData,
  provider: string,
  id: number,
  accessToken: string,
) {
  const imageFiles = formData.getAll("images") as File[];

  try {
    // 토큰 유효성 검증
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const response = await fetch(`${apiUrl}/user/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unauthorized: Invalid token");
    }

    // 사용자 ID 검증 (본인 확인)
    const user = await response.json();
    if (user.data.id !== id) {
      throw new Error("Unauthorized: User mismatch");
    }
    // 각 파일 유효성 검사
    const validationResult = z.array(ImageSchema).safeParse(imageFiles);
    if (!validationResult.success) {
      throw new Error(
        validationResult.error.issues.map((e) => e.message).join(", "),
      );
    }

    // 모든 파일을 Vercel Blob에 병렬로 업로드
    const blobs = await Promise.all(
      imageFiles.map((file) => {
        return put(`${provider}-${id}/sales-images/${file.name}`, file, {
          access: "public",
        });
      }),
    );

    return { success: true, blobs };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "이미지 업로드에 실패했습니다.",
    };
  }
}
