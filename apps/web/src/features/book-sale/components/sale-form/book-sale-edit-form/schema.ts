import { z } from "zod";

import { createSellFormSchema } from "../book-sale-form/schema";

// 기존 sellFormSchema에서 images와 book 필드를 제거하고,
// optional인 images 필드를 새로 정의하여 병합합니다.
// 기존 sellFormSchema에서 images와 book 필드를 제거하고,
// optional인 images 필드를 새로 정의하여 병합합니다.
export const createEditFormSchema = (t: (key: string) => string) =>
  createSellFormSchema(t)
    .omit({ images: true, book: true })
    .extend({
      images: z
        .custom<FileList>()
        .refine((files) => files.length <= 5, t("images_edit_max"))
        .optional(),
    });

// 수정 폼에서 사용할 타입
export type EditFormValues = z.infer<ReturnType<typeof createEditFormSchema>>;
