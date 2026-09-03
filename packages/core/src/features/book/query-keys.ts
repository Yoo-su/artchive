import { createQueryKeys } from "@lukemorales/query-key-factory";

import { GetBookListParams } from "./types";

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
  stats: (isbn: string) => ({
    queryKey: [isbn],
  }),
  search: (query: string) => ({
    queryKey: [query],
  }),
  summary: (isbn: string) => ({
    queryKey: [isbn],
  }),
  popularBooks: null,
  popularKeywords: null,
});
