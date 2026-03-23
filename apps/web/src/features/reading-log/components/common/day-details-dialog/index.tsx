"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { BookSearchModal } from "@/features/book/components/common/book-search-modal";
import { BookInfo } from "@/features/book/types";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { ScrollArea } from "@/shared/components/shadcn/scroll-area";

import {
  useCreateReadingLogMutation,
  useDeleteReadingLogMutation,
  useUpdateReadingLogMutation,
} from "../../../queries";
import { ReadingLog } from "../../../types";
import { ReadingLogFormDialog } from "../reading-log-form-dialog";

interface DayDetailsDialogProps {
  date: Date | null;
  logs: ReadingLog[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DayDetailsDialog({
  date,
  logs,
  open,
  onOpenChange,
}: DayDetailsDialogProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 생성 모드 상태
  const [selectedBookForCreate, setSelectedBookForCreate] =
    useState<BookInfo | null>(null);

  // 수정 모드 상태
  const [editingLog, setEditingLog] = useState<ReadingLog | null>(null);

  const createMutation = useCreateReadingLogMutation();
  const deleteMutation = useDeleteReadingLogMutation();
  const updateMutation = useUpdateReadingLogMutation();

  if (!date) return null;

  const handleBookSelect = (book: BookInfo) => {
    // 해당 날짜에 이미 추가된 책인지 확인
    const exists = logs.some((log) => log.isbn === book.isbn);
    if (exists) {
      toast.error("이미 추가된 책입니다.");
      return;
    }

    setSelectedBookForCreate(book);
  };

  const handleCreateLog = (memo: string) => {
    if (!selectedBookForCreate || !date) return;

    createMutation.mutate(
      {
        isbn: selectedBookForCreate.isbn,
        date: format(date, "yyyy-MM-dd"),
        memo,
      },
      {
        onSuccess: () => {
          toast.success("책이 기록되었습니다.");
          setSelectedBookForCreate(null);
        },
        onError: () => {
          toast.error("기록 저장 중 오류가 발생했습니다.");
        },
      },
    );
  };

  const handleEditClick = (log: ReadingLog) => {
    setEditingLog(log);
  };

  const handleUpdateLog = (memo: string) => {
    if (!editingLog) return;

    updateMutation.mutate(
      {
        id: editingLog.id,
        memo,
      },
      {
        onSuccess: () => {
          toast.success("메모가 수정되었습니다.");
          setEditingLog(null);
        },
        onError: () => {
          toast.error("수정 중 오류가 발생했습니다.");
        },
      },
    );
  };

  const handleRemoveLog = (log: ReadingLog) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteMutation.mutate(
        { id: log.id, date: log.date },
        {
          onSuccess: () => {
            toast.success("기록이 삭제되었습니다.");
          },
          onError: () => {
            toast.error("삭제 중 오류가 발생했습니다.");
          },
        },
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-bold font-serif tracking-tight text-stone-900">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl shadow-sm bg-stone-100 text-stone-600">
                <CalendarIcon className="w-5 h-5" />
              </span>
              {format(date, "M월 d일 eeee", { locale: ko })}
            </DialogTitle>
            <DialogDescription className="text-stone-500">
              오늘 읽은 책들의 감상을 남겨보세요.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 mb-2">
            <BookSearchModal
              open={isSearchOpen}
              onOpenChange={setIsSearchOpen}
              onSelect={handleBookSelect}
              trigger={
                <Button
                  variant="outline"
                  className="w-full justify-center h-12 border-dashed transition-all hover:bg-stone-50 hover:border-stone-300 border-stone-200 text-stone-500 bg-white"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새로운 책 기록하기
                </Button>
              }
            />
          </div>

          <ScrollArea className="max-h-[60vh] mt-2 -mx-6 px-6">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 text-sm mx-1">
                <p>아직 기록된 책이 없습니다.</p>
                <p className="mt-1">위 버튼을 눌러 독서 기록을 시작해보세요!</p>
              </div>
            ) : (
              <div className="space-y-4 p-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="group relative flex gap-4 p-4 border border-stone-100 rounded-2xl bg-white shadow-sm hover:shadow-md hover:border-stone-200 transition-all hover:-translate-y-0.5"
                  >
                    <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden shadow-md bg-stone-100 ring-1 ring-black/5">
                      <Image
                        src={log.book.image}
                        alt={log.book.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-stone-800 line-clamp-1 text-base font-serif tracking-tight">
                            {log.book.title}
                          </h4>
                          <p className="text-xs text-stone-500 font-medium mt-0.5">
                            {log.book.author}
                          </p>
                        </div>
                        <div className="flex items-center -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                            onClick={() => handleEditClick(log)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            onClick={() => handleRemoveLog(log)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {log.memo && (
                        <div className="mt-auto pt-3 border-t border-stone-50">
                          <div className="flex items-start gap-2.5">
                            <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0 text-stone-400" />
                            {/* 전체 메모 표시 (line-clamp 제거) */}
                            <p className="text-sm text-stone-600 leading-relaxed break-all font-medium">
                              {log.memo}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 새 기록 생성 다이얼로그 */}
      <ReadingLogFormDialog
        mode="create"
        book={selectedBookForCreate}
        open={!!selectedBookForCreate}
        isPending={createMutation.isPending}
        onOpenChange={(open) => !open && setSelectedBookForCreate(null)}
        onSubmit={handleCreateLog}
      />

      {/* 기록 수정 다이얼로그 */}
      <ReadingLogFormDialog
        mode="edit"
        book={
          editingLog
            ? {
                title: editingLog.book.title,
                author: editingLog.book.author,
                image: editingLog.book.image,
              }
            : null
        }
        initialMemo={editingLog?.memo}
        open={!!editingLog}
        isPending={updateMutation.isPending}
        onOpenChange={(open) => !open && setEditingLog(null)}
        onSubmit={handleUpdateLog}
      />
    </>
  );
}
