import { createQueryKeys } from "@lukemorales/query-key-factory";

import { GetReviewsParams } from "../types";

export const reviewKeys = createQueryKeys("review", {
  list: (params: GetReviewsParams) => ({
    queryKey: [params],
  }),
  feeds: {
    queryKey: null,
  },
  popular: {
    queryKey: null,
  },
  detail: (id: number) => ({
    queryKey: [id],
  }),
  forEdit: (id: number) => ({
    queryKey: ["edit", id],
  }),
  recommend: (id: number) => ({
    queryKey: [id],
  }),
});
