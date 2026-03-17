import { createQueryKeys } from "@lukemorales/query-key-factory";

export const readingLogKeys = createQueryKeys("readingLog", {
  all: null,
  list: (year: number, month: number) => ({
    queryKey: [year, month],
  }),
  stats: (year: number, month: number) => ({
    queryKey: [year, month],
  }),
  infinite: null,
  settings: null,
});
