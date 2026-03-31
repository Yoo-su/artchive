import { createQueryKeys } from "@lukemorales/query-key-factory";

import { GetArtListParams } from "./types";

export const artKeys = createQueryKeys("art", {
  list: (params: GetArtListParams) => ({
    queryKey: [params],
  }),
  detail: (id: string) => ({
    queryKey: [id],
  }),
});
