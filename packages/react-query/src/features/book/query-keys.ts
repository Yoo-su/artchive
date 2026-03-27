import { GetBookListParams } from "@bookjeok/core/book";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const bookKeys = createQueryKeys("book", {
  list: (params: GetBookListParams) => ({
    queryKey: [
      params.query,
      params.display ?? 10,
      params.start ?? 1,
      params.sort ?? "sim",
    ],
  }),
  detail: (isbn: string) => ({
    queryKey: [isbn],
  }),
  search: (query: string) => ({
    queryKey: [query],
  }),
  popularBooks: {
    queryKey: null,
  },
  popularKeywords: {
    queryKey: null,
  },
});
