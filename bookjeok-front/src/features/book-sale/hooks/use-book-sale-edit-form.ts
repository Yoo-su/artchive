import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  editFormSchema,
  EditFormValues,
} from "../components/sale-form/book-sale-edit-form/schema";
import { useUpdateBookSaleMutation } from "../mutations";
import { UpdateBookSaleParams, UsedBookSale } from "../types";
import { validateAndGetNewImages } from "../utils/image-utils";

interface UseBookSaleEditFormProps {
  sale: UsedBookSale;
}

export const useBookSaleEditForm = ({ sale }: UseBookSaleEditFormProps) => {
  const { mutate, isPending, isSuccess } = useUpdateBookSaleMutation();

  const isSubmitDisabled = isPending || isSuccess;

  const [existingImages, setExistingImages] = useState<string[]>(
    sale.imageUrls,
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      title: sale.title,
      price: String(sale.price),
      city: sale.city,
      district: sale.district,
      latitude: sale.latitude ?? undefined,
      longitude: sale.longitude ?? undefined,
      placeName: sale.placeName ?? "",
      content: sale.content,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    const dataTransfer = new DataTransfer();
    newImageFiles.forEach((file) => dataTransfer.items.add(file));
    form.setValue("images", dataTransfer.files, { shouldValidate: true });
  }, [newImageFiles, form]);

  const handleImagesAdd = (newFiles: FileList) => {
    const currentTotal = existingImages.length + newImageFiles.length;
    const validFiles = validateAndGetNewImages(newFiles, currentTotal);

    if (!validFiles) return;

    setNewImageFiles((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleExistingImageRemove = (urlToRemove: string) => {
    setExistingImages((prev) => prev.filter((url) => url !== urlToRemove));
    setDeletedImages((prev) => [...prev, urlToRemove]);
  };

  const handleNewImageRemove = (indexToRemove: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const onSubmit = (data: EditFormValues) => {
    if (existingImages.length + newImageFiles.length === 0) {
      form.setError("images", { message: "이미지를 1개 이상 등록해주세요." });
      return;
    }

    const payload: UpdateBookSaleParams = {
      title: data.title,
      price: Number(data.price),
      city: data.city,
      district: data.district,
      latitude: data.latitude,
      longitude: data.longitude,
      placeName: data.placeName,
      content: data.content,
      imageUrls: existingImages,
    };

    mutate({
      saleId: sale.id,
      payload,
      newImageFiles,
      deletedImageUrls: deletedImages,
    });
  };

  return {
    form,
    existingImages,
    newImagePreviews,
    isSubmitDisabled,
    handleImagesAdd,
    handleExistingImageRemove,
    handleNewImageRemove,
    onSubmit: form.handleSubmit(onSubmit, () => {
      toast.error("입력 정보를 다시 확인해주세요. (필수 항목 누락 등)");
    }),
  };
};
