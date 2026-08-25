import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { validateImageForUpload } from "@/shared/utils/compress-image";

interface UseImageUploadOptions {
  /**
   * 최대 첨부 가능한 이미지 개수
   * @default 5
   */
  maxFiles?: number;
  /**
   * (수정 모드용) 이미 서버에 업로드되어 있던 이미지 URL 배열
   */
  initialExistingImages?: string[];
  /**
   * 새로운 로컬 파일이 추가되거나 삭제될 때 호출되는 콜백
   */
  onFilesChange?: (files: File[]) => void;
  /**
   * 기존 이미지가 삭제될 때 호출되는 콜백
   */
  onExistingImagesChange?: (urls: string[]) => void;
}

export const useImageUpload = ({
  maxFiles = 5,
  initialExistingImages = [],
  onFilesChange,
  onExistingImagesChange,
}: UseImageUploadOptions = {}) => {
  const t = useTranslations("common");
  const [existingImages, setExistingImages] = useState<string[]>(
    initialExistingImages,
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const previewsRef = useRef<string[]>([]);
  previewsRef.current = newPreviews;

  // 컴포넌트 언마운트 시 메모리 누수 방지를 위한 objectURL 일괄 해제
  useEffect(() => {
    return () => {
      previewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleImagesAdd = useCallback(
    (files: FileList) => {
      const fileArray = Array.from(files);

      // 파일 형식 및 크기 검증
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validationError = validateImageForUpload(file, {
          onlyImage: t("image.only_image_allowed"),
          sizeLimitExceeded: (sizeMB, maxSizeMB) =>
            t("image.size_limit_exceeded", { size: sizeMB, maxSize: maxSizeMB }),
        });
        if (validationError) {
          toast.error(validationError);
          return;
        }
        validFiles.push(file);
      }

      // 최대 개수 초과 검증
      const totalCount =
        existingImages.length + newFiles.length + validFiles.length;
      if (totalCount > maxFiles) {
        toast.error(t("toast.max_images", { max: maxFiles }));
        return;
      }

      const updatedFiles = [...newFiles, ...validFiles];
      setNewFiles(updatedFiles);

      // 브라우저 캐시를 이용해 미리보기용 URL 생성
      const addedPreviews = validFiles.map((file) => URL.createObjectURL(file));
      setNewPreviews((prev) => [...prev, ...addedPreviews]);

      onFilesChange?.(updatedFiles);
    },
    [existingImages.length, newFiles, maxFiles, onFilesChange, t],
  );

  const handleNewImageRemove = useCallback(
    (indexToRemove: number) => {
      setNewPreviews((prev) => {
        // 제거되는 이미지의 메모리 해제
        URL.revokeObjectURL(prev[indexToRemove]);
        return prev.filter((_, index) => index !== indexToRemove);
      });

      const updatedFiles = newFiles.filter(
        (_, index) => index !== indexToRemove,
      );
      setNewFiles(updatedFiles);

      onFilesChange?.(updatedFiles);
    },
    [newFiles, onFilesChange],
  );

  const handleExistingImageRemove = useCallback(
    (urlToRemove: string) => {
      const updatedExisting = existingImages.filter(
        (url) => url !== urlToRemove,
      );
      setExistingImages(updatedExisting);
      onExistingImagesChange?.(updatedExisting);
    },
    [existingImages, onExistingImagesChange],
  );

  return {
    existingImages,
    newPreviews,
    handleImagesAdd,
    handleNewImageRemove,
    handleExistingImageRemove,
    totalImages: existingImages.length + newFiles.length,
  };
};
