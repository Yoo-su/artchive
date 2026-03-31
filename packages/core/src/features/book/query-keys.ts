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
  search: (query: string) => ({
    queryKey: [query],
  }),
  popularBooks: null,
  popularKeywords: null,
});
