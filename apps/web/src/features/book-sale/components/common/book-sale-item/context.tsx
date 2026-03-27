import { UsedBookSale } from "@bookjeok/core/book-sale";
import { createContext, useContext } from "react";

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
      "UsedBookSale compound components cannot be rendered outside the UsedBookSale.Root component",
    );
  }

  return context;
}
