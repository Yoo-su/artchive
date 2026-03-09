import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { BookInfo } from "@/features/book/types";

import {
  createSellFormSchema,
  SellFormValues,
} from "../components/sale-form/book-sale-form/schema";
import { useCreateBookSaleMutation } from "../mutations";
import { CreateBookSaleParams } from "../types";
import { validateAndGetNewImages } from "../utils/image-utils";

export const useBookSaleForm = () => {
  const t = useTranslations("market.validation");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { mutate, isPending, isSuccess } = useCreateBookSaleMutation();

  const isSubmitDisabled = isPending || isSuccess;

  const form = useForm<SellFormValues>({
    resolver: zodResolver(createSellFormSchema(t)),
    defaultValues: {
      title: "",
      price: "",
      content: "",
      city: "",
      district: "",
      latitude: undefined,
      longitude: undefined,
      placeName: "",
      book: null,
    },
  });

  const selectedBook = form.watch("book");

  const handleBookSelect = (book: BookInfo | null) => {
    form.setValue("book", book, { shouldValidate: true });
  };

  const handleImagesAdd = (newFiles: FileList) => {
    const currentFiles = Array.from(form.getValues("images") || []);

    // 유틸 함수를 사용해 검증 및 변환
    const validNewFiles = validateAndGetNewImages(
      newFiles,
      currentFiles.length,
    );
    if (!validNewFiles) return;

    const combinedFiles = [...currentFiles, ...validNewFiles];

    const dataTransfer = new DataTransfer();
    combinedFiles.forEach((file) => dataTransfer.items.add(file));
    form.setValue("images", dataTransfer.files, { shouldValidate: true });

    const newPreviews = combinedFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const handleImageRemove = (indexToRemove: number) => {
    const updatedPreviews = imagePreviews.filter(
      (_, index) => index !== indexToRemove,
    );
    setImagePreviews(updatedPreviews);

    const currentFiles = Array.from(form.getValues("images") || []);
    const updatedFiles = currentFiles.filter(
      (_, index) => index !== indexToRemove,
    );

    const dataTransfer = new DataTransfer();
    updatedFiles.forEach((file) => dataTransfer.items.add(file));
    form.setValue("images", dataTransfer.files, { shouldValidate: true });
  };

  const onSubmit = (data: SellFormValues) => {
    if (!data.book) return;
    const imageFiles = Array.from(data.images);

    const payload: Omit<CreateBookSaleParams, "imageUrls"> = {
      title: data.title,
      price: Number(data.price),
      city: data.city,
      district: data.district,
      latitude: data.latitude,
      longitude: data.longitude,
      placeName: data.placeName,
      content: data.content,
      book: {
        isbn: data.book.isbn,
        title: data.book.title,
        description: data.book.description,
        author: data.book.author,
        publisher: data.book.publisher,
        image: data.book.image,
        pubdate: data.book.pubdate,
        discount: data.book.discount,
      },
    };

    mutate({ imageFiles, payload });
  };

  return {
    form,
    imagePreviews,
    isSubmitDisabled,
    selectedBook,
    setSelectedBook: handleBookSelect,
    handleImagesAdd,
    handleImageRemove,
    onSubmit: form.handleSubmit(onSubmit, () => {
      toast.error(t("submit_error"));
    }),
  };
};
