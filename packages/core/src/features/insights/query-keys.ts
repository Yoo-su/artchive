import { createQueryKeys } from "@lukemorales/query-key-factory";

export const insightsKeys = createQueryKeys("insights", {
  all: null,
  locationSales: (city: string, district: string) => ({
    queryKey: [city, district],
  }),
});
