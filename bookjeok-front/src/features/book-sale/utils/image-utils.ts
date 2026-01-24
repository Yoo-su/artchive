import { toast } from "sonner";

import { validateImageForUpload } from "@/shared/utils/compress-image";

/**
 * 이미지 파일 목록을 검증합니다.
 * - 파일 형식, 크기 검증
 * - 총 개수 제한 검증
 */
export const validateAndGetNewImages = (
  newFiles: FileList,
  currentCount: number,
  maxCount: number = 5,
): File[] | null => {
  const files = Array.from(newFiles);

  for (const file of files) {
    const validationError = validateImageForUpload(file);
    if (validationError) {
      toast.error(validationError);
      return null;
    }
  }

  if (currentCount + files.length > maxCount) {
    toast.error(`이미지는 최대 ${maxCount}개까지 첨부할 수 있습니다.`);
    return null;
  }

  return files;
};
