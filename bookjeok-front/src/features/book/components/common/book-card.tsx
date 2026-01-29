import Image from "next/image";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { BookInfo } from "../../types";

interface BookCardProps {
  book: BookInfo;
}

export const BookCard = ({ book }: BookCardProps) => {
  return (
    <Link href={PATHS.BOOK_DETAIL(book.isbn)} className="group block">
      <div className="relative w-full aspect-[1/1.4] overflow-hidden bg-gray-100 rounded-lg shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
        <Image
          src={book.image.replace("?type=m1", "")}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {book.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 truncate">{book.author}</p>
      </div>
    </Link>
  );
};

BookCard.Skeleton = function BookCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full aspect-[1/1.4] bg-gray-200 rounded-lg" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};
