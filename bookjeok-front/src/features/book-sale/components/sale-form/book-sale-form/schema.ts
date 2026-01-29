import { z } from "zod";

import { KOREA_DISTRICTS } from "@/shared/constants/korea-districts";

export const createSellFormSchema = (t: (key: string) => string) =>
  z
    .object({
      title: z.string().min(5, t("title_min")).max(50, t("title_max")),
      price: z
        .string()
        .refine((val) => /^\d+$/.test(val), t("price_number"))
        .refine((val) => parseInt(val) > 0, t("price_min")),
      city: z.string().min(1, t("city_required")),
      district: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      placeName: z.string().min(1, t("location_required")),
      content: z.string().min(10, t("content_min")).max(1000, t("content_max")),
      images: z
        .custom<FileList>()
        .refine((files) => files && files.length > 0, t("images_min"))
        .refine((files) => files && files.length <= 5, t("images_max")),
      book: z
        .object({
          isbn: z.string(),
          title: z.string(),
          author: z.string(),
          publisher: z.string(),
          image: z.string(),
          description: z.string(),
          pubdate: z.string(),
        })
        .nullable()
        .refine((val) => val !== null, t("book_required")),
    })
    .refine(
      (data) => {
        const districtsForCity = KOREA_DISTRICTS[data.city];
        if (districtsForCity && districtsForCity.length > 0) {
          return !!data.district;
        }
        return true;
      },
      {
        message: t("district_required"),
        path: ["district"],
      },
    );

export type SellFormValues = z.infer<ReturnType<typeof createSellFormSchema>>;
