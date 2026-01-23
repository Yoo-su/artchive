import { createQueryKeys } from "@lukemorales/query-key-factory";

export const userKeys = createQueryKeys("user", {
  stats: null,
  wishlist: null,
  me: null,
  wishlistCheck: (type: string, id: string | number) => ({
    queryKey: [type, id],
  }),
  profile: (handle: string) => ({
    queryKey: [handle],
  }),
});
