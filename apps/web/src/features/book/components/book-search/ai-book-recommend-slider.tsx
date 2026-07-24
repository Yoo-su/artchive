"use client";

import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BookCard } from "@/features/book/components/common/book-card";
import { AiSearchBookItem } from "@/features/book/queries/use-ai-search-query";

interface AiBookRecommendSliderProps {
  books: AiSearchBookItem[];
}

export const AiBookRecommendSlider = ({
  books,
}: AiBookRecommendSliderProps) => {
  if (!books || books.length === 0) return null;

  return (
    <div className="mt-4 w-full bg-stone-50/50 border border-stone-200/60 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-stone-200/50 pb-2.5">
        <span className="text-xs font-semibold tracking-wider text-stone-700 uppercase">
          AI 엄선 추천 도서 ({books.length}권)
        </span>
        <span className="text-[11px] text-stone-400">
          좌우 스와이프로 확인하세요
        </span>
      </div>

      <Swiper
        modules={[FreeMode]}
        freeMode={true}
        slidesPerView={1.3}
        spaceBetween={14}
        breakpoints={{
          640: { slidesPerView: 2.2, spaceBetween: 14 },
          1024: { slidesPerView: 2.5, spaceBetween: 16 },
        }}
        className="w-full !py-1"
      >
        {books.map((book) => (
          <SwiperSlide key={book.isbn} className="!h-auto">
            <div className="h-full bg-white border border-stone-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-stone-300 transition-all">
              <BookCard
                book={{
                  isbn: book.isbn,
                  title: book.title,
                  author: book.author,
                  publisher: book.publisher,
                  description: book.description,
                  image: book.image,
                  discount: "",
                  link: "",
                  pubdate: "",
                }}
              />

              {book.reason && (
                <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 leading-relaxed border border-stone-100/80">
                  <span className="font-medium text-stone-800 block mb-1">
                    추천 까닭
                  </span>
                  {book.reason}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};
