import { GetArtListParams } from "@bookjeok/core/art";
import { createQueryKeys } from "@lukemorales/query-key-factory";

export const artKeys = createQueryKeys("art", {
  list: (params: GetArtListParams) => ({
    queryKey: [params],
  }),
  detail: (id: string) => ({
    queryKey: [id],
  }),
});
