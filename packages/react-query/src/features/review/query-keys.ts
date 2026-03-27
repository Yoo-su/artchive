import { GetReviewsParams } from "@bookjeok/core/review";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const reviewKeys = createQueryKeys("review", {
  list: (params: GetReviewsParams) => ({
    queryKey: [params],
  }),
  feeds: () => ({
    queryKey: [undefined],
  }),
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
