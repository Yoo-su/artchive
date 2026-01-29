"use client";

import React, { ReactNode } from "react";

import { UsedBookSale } from "@/features/book-sale/types";
import { Card } from "@/shared/components/shadcn/card";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { BookSaleContext } from "./context";

interface BookSaleRootProps {
  sale: UsedBookSale;
  children: ReactNode;
  className?: string;
  href?: string;
  rank?: number;
  priority?: boolean;
}

export const Root = ({
  sale,
  children,
  className,
  href,
  rank,
  priority = false,
}: BookSaleRootProps) => {
  const linkHref = href || PATHS.BOOK_SALES_DETAIL(String(sale.id));

  return (
    <BookSaleContext.Provider value={{ sale, rank, priority }}>
      <Link
        href={linkHref}
        passHref
        className={cn("block h-full w-full group", className)}
      >
        <Card
          className={cn(
            "relative h-full w-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border-stone-200",
          )}
        >
          <div className="flex flex-col h-full">{children}</div>
        </Card>
      </Link>
    </BookSaleContext.Provider>
  );
};
