import { BookInfo, CreateBookSaleParams, TradeMethod } from "@bookjeok/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useImageUpload } from "@/shared/hooks/use-image-upload";
import { useSafeSubmit } from "@/shared/hooks/use-safe-submit";

import { UploadStep } from "../components/common/upload-progress-modal";
import {
  createSellFormSchema,
  SellFormValues,
} from "../components/sale-form/book-sale-form/schema";
import { useCreateBookSaleMutation } from "../mutations";

export const useBookSaleForm = () => {
  const t = useTranslations("market.validation");

  const { mutateAsync, isPending, isSuccess } = useCreateBookSaleMutation();
  const { executeSafeSubmit } = useSafeSubmit();

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isSubmitDisabled = isPending || isSuccess || isModalOpen;

  const isPaymentFeatureEnabled =
    process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";

  const form = useForm<SellFormValues>({
    resolver: zodResolver(createSellFormSchema(t)),
    defaultValues: {
      title: "",
      price: "",
      tradeMethod: isPaymentFeatureEnabled
        ? TradeMethod.BOTH
        : TradeMethod.DIRECT_ONLY,
      content: "",
      city: "",
      district: "",
      latitude: undefined,
      longitude: undefined,
      placeName: "",
      book: null,
    },
  });

  const {
    newPreviews: imagePreviews,
    handleImagesAdd,
    handleNewImageRemove,
  } = useImageUpload({
    maxFiles: 5,
    onFilesChange: (files: File[]) => {
      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      form.setValue("images", dataTransfer.files, { shouldValidate: true });
    },
  });

  const selectedBook = form.watch("book");

  const handleBookSelect = (book: BookInfo | null) => {
    form.setValue("book", book, { shouldValidate: true });
  };

  const onSubmit = (data: SellFormValues) => {
    if (!data.book) return;
    const imageFiles = Array.from(data.images);

    const payload: Omit<CreateBookSaleParams, "imageUrls"> = {
      title: data.title,
      price: Number(data.price),
      tradeMethod: data.tradeMethod,
      city: data.city,
      district: data.district,
      latitude: data.latitude,
      longitude: data.longitude,
      placeName: data.placeName,
      content: data.content,
      isbn: data.book.isbn,
    };

    setIsModalOpen(true);
    setUploadStep("compressing");
    setUploadProgress(10);

    executeSafeSubmit(async (idempotencyKey) => {
      try {
        await mutateAsync({
          imageFiles,
          payload,
          idempotencyKey,
          onProgressState: (step, percent) => {
            setUploadStep(step);
            setUploadProgress(percent);
          },
        });
        setUploadStep("success");
        setUploadProgress(100);
      } catch (error) {
        setIsModalOpen(false);
        setUploadStep("idle");
        setUploadProgress(0);
        throw error;
      }
    });
  };

  return {
    form,
    imagePreviews,
    isSubmitDisabled,
    selectedBook,
    setSelectedBook: handleBookSelect,
    handleImagesAdd,
    handleImageRemove: handleNewImageRemove,
    uploadStep,
    uploadProgress,
    isModalOpen,
    onSubmit: form.handleSubmit(onSubmit, () => {
      toast.error(t("submit_error"));
    }),
  };
};
