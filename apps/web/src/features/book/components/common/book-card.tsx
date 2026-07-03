import { BookInfo } from "@bookjeok/core";
import Image from "next/image";

import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

interface BookCardProps {
  book: BookInfo;
}

// 도서 카드 - 표지 + 하단 메타 분리 레이아웃
export const BookCard = ({ book }: BookCardProps) => {
  return (
    <Link href={PATHS.BOOK_DETAIL(book.isbn)} className="group block">
      {/* 표지 이미지 */}
      <div className="relative w-full aspect-3/4 overflow-hidden rounded-sm bg-stone-100 shadow-md transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-lg">
        <Image
          src={book.image.replace("?type=m1", "")}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover"
          unoptimized
        />

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/8" />
      </div>

      {/* 하단 메타 정보 */}
      <div className="mt-2.5 px-0.5">
        <h3 className="text-sm font-medium text-stone-800 line-clamp-1 transition-colors duration-200 group-hover:text-stone-950">
          {book.title}
        </h3>
        <p className="mt-0.5 text-xs text-stone-400 truncate">
          {book.author}
        </p>
      </div>
    </Link>
  );
};

// 도서 카드 스켈레톤
BookCard.Skeleton = function BookCardSkeleton() {
  return (
    <div className="block">
      <div className="relative w-full aspect-3/4 overflow-hidden rounded-sm bg-stone-100 shadow-md animate-pulse" />
      <div className="mt-2.5 px-0.5 space-y-1.5">
        <Skeleton className="h-4 w-3/4 bg-stone-200/60" />
        <Skeleton className="h-3 w-1/2 bg-stone-200/40" />
      </div>
    </div>
  );
};
