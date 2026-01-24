import { createContext, useContext } from "react";

import { UsedBookSale } from "@/features/book-sale/types";

interface BookSaleContextValue {
  sale: UsedBookSale;
  rank?: number;
  priority?: boolean;
}

export const BookSaleContext = createContext<BookSaleContextValue | null>(null);

export function useBookSaleContext() {
  const context = useContext(BookSaleContext);

  if (!context) {
    throw new Error(
      "BookSale compound components cannot be rendered outside the BookSale.Root component",
    );
  }

  return context;
}
