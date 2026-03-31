"use client";

import { NEOGULIP_TEXTS, RecommendedBook } from "@bookjeok/core";

import { useRecommendStore } from "@/features/recommend/stores/recommend-store";
import { NeogulipIcon } from "@/shared/components/icons/neogulip-icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/shadcn/alert-dialog";
import { useRouter } from "@/shared/config/i18n/routing";

interface ResultViewProps {
  setInput: (value: string) => void;
}

export const TasteFinderResultView = ({ setInput }: ResultViewProps) => {
  const router = useRouter();
  const { isFinal, recommendedBooks, clearMessages } = useRecommendStore();

  if (!isFinal) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center space-y-6 p-4">
        <div className="w-32 h-32 bg-neogulip-bg rounded-full flex items-center justify-center mb-2 animate-pulse border-2 border-neogulip-border">
          <NeogulipIcon className="w-20 h-20 opacity-80" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-neogulip-brown-primary">
            {NEOGULIP_TEXTS.WAITING_TITLE}
          </h4>
          <p className="text-base text-neogulip-brown-secondary mt-2 leading-relaxed">
            {NEOGULIP_TEXTS.WAITING_DESC_PREFIX}
            <br />딱 맞는{" "}
            <span className="text-neogulip-text font-bold">
              {NEOGULIP_TEXTS.WAITING_DESC_HIGHLIGHT}
            </span>
            {NEOGULIP_TEXTS.WAITING_DESC_SUFFIX}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center pb-4 border-b border-neogulip-bg-accent">
        <h4 className="text-2xl font-bold text-neogulip-brown-primary flex items-center justify-center gap-2">
          {NEOGULIP_TEXTS.SUCCESS_TITLE}
        </h4>
        <p className="mt-2 text-neogulip-brown-secondary">
          {NEOGULIP_TEXTS.SUCCESS_DESC}
        </p>
      </div>

      <div className="grid gap-6 pb-4 relative">
        <div className="space-y-6">
          {recommendedBooks?.map((book: RecommendedBook, idx: number) => (
            <div
              key={idx}
              onClick={() =>
                router.push(`/book/search?q=${encodeURIComponent(book.title)}`)
              }
              className="group relative bg-white rounded-2xl p-6 border border-neogulip-bg-accent shadow-sm hover:shadow-lg hover:border-neogulip-border transition-all duration-300 cursor-pointer"
            >
              <div className="flex gap-5 items-start">
                <div className="flex flex-col flex-1 min-w-0">
                  <h5 className="font-bold text-neogulip-brown-dark text-xl line-clamp-1 group-hover:text-neogulip-text transition-colors">
                    {book.title}
                  </h5>
                  <p className="text-sm text-neogulip-brown-primary mt-1 font-medium">
                    {book.author}
                  </p>
                  <p className="text-sm text-neogulip-brown-text mt-3 leading-relaxed line-clamp-3">
                    {book.description}
                  </p>

                  <div className="mt-4 flex items-center text-xs font-bold text-neogulip-text/80 group-hover:text-neogulip-text transition-colors">
                    <span>도서 검색하러 가기</span>
                    <svg
                      className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-sm text-neogulip-brown-muted hover:text-neogulip-brown-primary underline decoration-dashed transition-colors">
                {NEOGULIP_TEXTS.RETRY_LINK}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neogulip-bg border-neogulip-border rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neogulip-text">
                  {NEOGULIP_TEXTS.NEW_SEARCH_TITLE}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neogulip-subtext">
                  {NEOGULIP_TEXTS.NEW_SEARCH_DESC}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border-neogulip-border text-neogulip-subtext hover:bg-neogulip-bg-accent hover:text-neogulip-text rounded-xl">
                  {NEOGULIP_TEXTS.NEW_SEARCH_CANCEL}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearMessages();
                    setInput("");
                  }}
                  className="bg-neogulip-light text-white hover:bg-neogulip-primary rounded-xl"
                >
                  {NEOGULIP_TEXTS.NEW_SEARCH_CONFIRM}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
