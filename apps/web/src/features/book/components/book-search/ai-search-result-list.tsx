"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { BookCard } from "@/features/book/components/common/book-card";
import { useAiSearchQuery } from "@/features/book/queries/use-ai-search-query";
import { Skeleton } from "@/shared/components/shadcn/skeleton";
import { cn } from "@/shared/utils/cn";

interface AiSearchResultListProps {
  query: string;
}

export const AiSearchResultList = ({ query }: AiSearchResultListProps) => {
  const t = useTranslations("book.search");

  const { data, isLoading, isError, error, isFetching } = useAiSearchQuery(
    query,
    Boolean(query),
  );

  // Case 1: 검색어 미입력 초기 상태
  if (!query) {
    return (
      <div className="py-20 text-center text-stone-400">
        <p className="text-lg font-medium text-stone-600">
          {t("ai_empty_title")}
        </p>
        <p className="mt-2 text-sm text-stone-400">{t("ai_empty_desc")}</p>
      </div>
    );
  }

  // Case 2: 최초 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-8 py-4">
        {/* AI 코멘트 카드 스켈레톤 */}
        <div className="bg-stone-50 border border-stone-200/70 rounded-2xl p-6 sm:p-8 space-y-3">
          <Skeleton className="h-4 w-32 bg-stone-200/70 rounded-md" />
          <Skeleton className="h-4 w-full bg-stone-200/50 rounded-md" />
          <Skeleton className="h-4 w-5/6 bg-stone-200/50 rounded-md" />
          <Skeleton className="h-4 w-2/3 bg-stone-200/50 rounded-md" />
        </div>

        {/* 도서 카드 스켈레톤 그리드 */}
        <div className="grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BookCard.Skeleton key={`ai-skeleton-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  // Case 3: 에러 발생
  if (isError) {
    return (
      <div className="py-16 text-center text-stone-500">
        <p className="text-base font-medium text-stone-700">
          추천 도서를 가져오는 중 잠시 지연이 발생했습니다.
        </p>
        <p className="mt-1 text-sm text-stone-400">
          {(error as any)?.response?.data?.message ||
            "잠시 후 다시 검색해주세요."}
        </p>
      </div>
    );
  }

  // Case 4: 검색 결과가 없는 경우
  if (data && data.books.length === 0) {
    return (
      <div className="py-20 text-center text-stone-500">
        <p className="text-lg">{t("no_results", { query })}</p>
        <p className="mt-2 text-sm">{t("check_typo")}</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        isFetching && "opacity-50 pointer-events-none",
      )}
    >
      {data && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-10"
        >
          {/* AI RAG 코멘트 영역 */}
          {data.explanation && (
            <motion.div
              variants={itemVariants}
              className="bg-stone-50/90 border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-xs"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                <h3 className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                  {t("ai_comment_title")}
                </h3>
              </div>
              <p className="text-sm sm:text-base text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                {data.explanation}
              </p>
            </motion.div>
          )}

          {/* 추천 도서 카드 그리드 목록 */}
          <div>
            <div className="mb-4 text-xs font-semibold tracking-wider text-stone-400 uppercase">
              맞춤 추천 도서 ({data.books.length}권)
            </div>

            <div className="grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-4">
              {data.books.map((book) => (
                <motion.div key={book.isbn} variants={itemVariants}>
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
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
