"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { NEOGULIP_THEME } from "@/features/recommend/constants/neogulip-theme";
import { useRecommendStore } from "@/features/recommend/stores/recommend-store";
import { useAddToWishlistMutation } from "@/features/user/mutations";
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
import { cn } from "@/shared/utils/cn";

interface BookItem {
  title: string;
  author: string;
  publisher: string;
  description: string;
  image: string;
  isbn: string;
  pubdate: string;
}

interface ResultViewProps {
  setInput: (value: string) => void;
}

export const TasteFinderResultView = ({ setInput }: ResultViewProps) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { isFinal, recommendedBooks, clearMessages } = useRecommendStore();
  const addToWishlist = useAddToWishlistMutation();

  const handleAddToWishlist = (book: BookItem) => {
    if (!user) {
      toast.error("로그인이 필요한 기능입니다.");
      router.push("/login");
      return;
    }

    addToWishlist.mutate(
      {
        type: "BOOK",
        id: book.isbn,
        bookData: {
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          image: book.image,
          description: book.description,
          pubdate: book.pubdate,
          link: "",
          discount: "",
        },
      },
      {
        onSuccess: () => {
          toast.success(`'${book.title}'이(가) 내 서재에 담겼어요! 📚`);
        },
        onError: () => {
          toast.error("이미 담겨있거나 오류가 발생했어요.");
        },
      },
    );
  };

  if (!isFinal) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center space-y-6 p-4">
        <div className="w-32 h-32 bg-neogulip-bg rounded-full flex items-center justify-center mb-2 animate-pulse border-2 border-neogulip-border">
          <NeogulipIcon className="w-20 h-20 opacity-80" />
        </div>
        <div>
          <h4 className="text-xl font-bold text-neogulip-brown-primary">
            {NEOGULIP_THEME.TEXTS.WAITING_TITLE}
          </h4>
          <p className="text-base text-neogulip-brown-secondary mt-2 leading-relaxed">
            {NEOGULIP_THEME.TEXTS.WAITING_DESC_PREFIX}
            <br />딱 맞는{" "}
            <span className="text-neogulip-text font-bold">
              {NEOGULIP_THEME.TEXTS.WAITING_DESC_HIGHLIGHT}
            </span>
            {NEOGULIP_THEME.TEXTS.WAITING_DESC_SUFFIX}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center pb-4 border-b border-neogulip-bg-accent">
        <h4 className="text-2xl font-bold text-neogulip-brown-primary flex items-center justify-center gap-2">
          {NEOGULIP_THEME.TEXTS.SUCCESS_TITLE}
        </h4>
        <p className="mt-2 text-neogulip-brown-secondary">
          {NEOGULIP_THEME.TEXTS.SUCCESS_DESC}
        </p>
      </div>

      <div
        className={cn(
          "grid gap-6 pb-4 relative",
          !user && "h-[400px] overflow-hidden",
        )}
      >
        {/* Auth Gating Overlay */}
        {!user && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-white/60 backdrop-blur-[2px] rounded-2xl border border-neogulip-border/50">
            <div className="bg-white/90 p-8 rounded-3xl shadow-xl border border-neogulip-border text-center max-w-sm animate-in zoom-in-95 duration-500">
              <div className="mx-auto w-16 h-16 bg-neogulip-bg rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h4 className="text-xl font-bold text-neogulip-brown-primary mb-2">
                {NEOGULIP_THEME.TEXTS.LOGIN_CTA_TITLE}
              </h4>
              <p className="text-neogulip-brown-secondary mb-6 whitespace-pre-wrap leading-relaxed">
                {NEOGULIP_THEME.TEXTS.LOGIN_CTA_DESC}
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full py-3.5 bg-neogulip-primary text-white font-bold rounded-xl shadow-lg hover:bg-neogulip-dark hover:shadow-xl hover:-translate-y-0.5 transition-all text-base flex items-center justify-center gap-2"
              >
                {NEOGULIP_THEME.TEXTS.LOGIN_BTN}
              </button>
            </div>
          </div>
        )}

        {/* Book List (Blurred if no user) */}
        <div
          className={cn(
            "space-y-6",
            !user &&
              "filter blur-md pointer-events-none select-none opacity-60",
          )}
        >
          {recommendedBooks?.map((book: BookItem, idx: number) => (
            <div
              key={idx}
              className="group relative bg-white rounded-2xl p-4 border border-neogulip-bg-accent shadow-sm hover:shadow-lg hover:border-neogulip-border transition-all duration-300"
            >
              <div className="flex gap-5">
                <div
                  className="h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-neogulip-bg shadow-inner cursor-pointer"
                  onClick={() => router.push(`/book/${book.isbn}`)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={book.image}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/book/${book.isbn}`)}
                  >
                    <h5 className="font-bold text-neogulip-brown-dark text-lg line-clamp-1 group-hover:text-neogulip-text transition-colors">
                      {book.title}
                    </h5>
                    <p className="text-sm text-neogulip-brown-primary mt-1 font-medium">
                      {book.author} · {book.publisher}
                    </p>
                    <p className="text-sm text-neogulip-brown-text mt-2 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWishlist(book);
                      }}
                      className="flex items-center gap-1.5 text-sm font-bold text-neogulip-text hover:text-neogulip-deep bg-neogulip-btn hover:bg-neogulip-btn-hover px-4 py-2 rounded-xl transition-all active:scale-95"
                    >
                      {NEOGULIP_THEME.TEXTS.ADD_TO_WISHLIST}
                    </button>
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
                {NEOGULIP_THEME.TEXTS.RETRY_LINK}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-neogulip-bg border-neogulip-border rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neogulip-text">
                  {NEOGULIP_THEME.TEXTS.NEW_SEARCH_TITLE}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-neogulip-subtext">
                  {NEOGULIP_THEME.TEXTS.NEW_SEARCH_DESC}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white border-neogulip-border text-neogulip-subtext hover:bg-neogulip-bg-accent hover:text-neogulip-text rounded-xl">
                  {NEOGULIP_THEME.TEXTS.NEW_SEARCH_CANCEL}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    clearMessages();
                    setInput("");
                  }}
                  className="bg-neogulip-light text-white hover:bg-neogulip-primary rounded-xl"
                >
                  {NEOGULIP_THEME.TEXTS.NEW_SEARCH_CONFIRM}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};
