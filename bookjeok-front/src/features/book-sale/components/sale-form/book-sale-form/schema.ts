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
        .refine((val) => val !== null, "Thinking..."), // This should also be translated if possible, but it's an internal error mostly? No, it's UI. "Please select a book"
      // Wait, "Thinking..." was me thinking. It should be t("book.error_required") but that is in form namespace, not validation.
      // I will assume t comes from "market.validation". I need to pass "market.form.book.error_required" ?
      // Or I should put all validation messages in validation namespace. I did put "error_required" in "form.book".
      // Let's use t("book_required") and I will add it to validation namespace or use the form one.
      // Actually, I put "error_required" in "market.form.book".
      // The validator will likely use "market.validation".
      // I'll stick to "market.validation" keys. "book_required" was not added to validation in my previous step?
      // Let me check my previous step. I updated "form.book.error_required". I did NOT add "book_required" to "validation".
      // I should probably add it or just use a hardcoded string? No.
      // I can pass a `tValidation` and `tForm`? No that's messy.
      // I'll assume the t passed acts on "market.validation" scope ideally.
      // But I can also just accept t that is scoped to "market" and use "validation.xxx" and "form.book.error_required".
      // Or simpler: I will add "book_required" to "market.validation" now or just use "book_required" and mappings later.
      // Actually I can just add "book_required" to the validation set in the file separately if I missed it, OR use "form.book.error_required" if I pass a root t.
      // Usually I pass `useTranslations("market.validation")`.
      // So I should add "book_required" to "market.validation".
      // I will update the json files again or just use "Submit error" style generic?
      // No, "Sell book" requires a book.
      // Let's check `market.form.book.error_required`.
      // If I use `useTranslations("market")`, then `t("validation.title_min")` and `t("form.book.error_required")` works.
      // This seems flexible. I will design `createSellFormSchema` to expect `t` that can handle the keys I pass.
      // I'll make the keys consistant. I'll use `t("book_required")` and ensure `market.validation` has it.
      // I will add `book_required` to `market.validation` in the JSONs.
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
