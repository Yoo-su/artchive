import { createQueryKeys } from "@lukemorales/query-key-factory";

export const chatKeys = createQueryKeys("chat", {
  rooms: {
    queryKey: null,
  },
  messages: (roomId: number) => ({
    queryKey: [roomId],
  }),
});
