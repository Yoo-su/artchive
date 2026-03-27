import { createQueryKeys } from "@lukemorales/query-key-factory";

export const userKeys = createQueryKeys("user", {
  publicProfile: (handle: string) => ({
    queryKey: [handle],
  }),
  wishlist: {
    queryKey: null,
  },
  wishlistCheck: (type: string, id: string | number) => ({
    queryKey: [type, id],
  }),
  stats: {
    queryKey: null,
  },
  me: {
    queryKey: null,
  },
});
