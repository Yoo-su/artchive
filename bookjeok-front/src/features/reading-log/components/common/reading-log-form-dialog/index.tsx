"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { CoolMode } from "@/shared/components/magicui/cool-mode";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { Textarea } from "@/shared/components/shadcn/textarea";

import { MAX_MEMO_LENGTH } from "../../../constants";

const formSchema = z.object({
  memo: z.string().max(MAX_MEMO_LENGTH, {
    message: `메모는 최대 ${MAX_MEMO_LENGTH}자까지 입력 가능합니다.`,
  }),
});

interface ReadingLogFormDialogProps {
  book: {
    title: string;
    author: string;
    image: string;
  } | null;
  initialMemo?: string;
  mode: "create" | "edit";
  open: boolean;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (memo: string) => void;
}

export function ReadingLogFormDialog({
  book,
  initialMemo = "",
  mode,
  open,
  isPending = false,
  onOpenChange,
  onSubmit,
}: ReadingLogFormDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memo: initialMemo,
    },
  });

  // 새로 열었을 때 초기화
  useEffect(() => {
    if (open) {
      form.reset({ memo: initialMemo });
    }
  }, [open, initialMemo, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values.memo);
    if (mode === "create") form.reset();
  };

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center font-serif text-stone-900">
            {mode === "create" ? "책 기록하기" : "메모 수정하기"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 p-4 bg-stone-50 rounded-2xl mb-2 items-center border border-stone-100/50">
          <div className="relative w-14 h-20 shrink-0 rounded-md overflow-hidden shadow-sm border border-stone-200">
            <Image
              src={book.image}
              alt={book.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-stone-800 line-clamp-1 font-serif tracking-tight">
              {book.title}
            </h4>
            <p className="text-sm text-stone-500 line-clamp-1">{book.author}</p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-stone-600 font-medium">
                    한 줄 메모{" "}
                    <span className="text-xs text-stone-400 font-normal">
                      (선택)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="이 책은 어떠셨나요? 짧은 감상을 남겨주세요."
                      className="resize-none h-24 focus-visible:ring-1 focus-visible:ring-offset-0 disabled:opacity-50 focus-visible:ring-stone-400 border-stone-200"
                      maxLength={MAX_MEMO_LENGTH}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-right text-xs text-stone-400">
                    {field.value.length} / {MAX_MEMO_LENGTH}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 border-stone-200 text-stone-600 hover:bg-stone-50"
                disabled={isPending}
              >
                취소
              </Button>
              <CoolMode>
                <Button
                  type="submit"
                  className="h-11 font-bold text-white hover:opacity-90 transition-opacity shadow-sm bg-stone-900 hover:bg-stone-800"
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>처리중...</span>
                    </div>
                  ) : mode === "create" ? (
                    "기록하기"
                  ) : (
                    "수정하기"
                  )}
                </Button>
              </CoolMode>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
