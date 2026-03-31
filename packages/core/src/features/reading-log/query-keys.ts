import { createQueryKeys } from "@lukemorales/query-key-factory";

export const readingLogKeys = createQueryKeys("readingLog", {
  list: (year: number, month: number) => ({
    queryKey: [year, month],
  }),
  stats: (year: number, month: number) => ({
    queryKey: [year, month],
  }),
  settings: null,
  infinite: null,
});
