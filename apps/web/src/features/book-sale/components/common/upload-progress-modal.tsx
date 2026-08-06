"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";

export type UploadStep =
  | "idle"
  | "compressing"
  | "uploading"
  | "submitting"
  | "success";

interface UploadProgressModalProps {
  open: boolean;
  step: UploadStep;
  progress: number;
  isEdit?: boolean;
}

export const UploadProgressModal = ({
  open,
  step,
  progress,
  isEdit = false,
}: UploadProgressModalProps) => {
  // 업로드 진행 중 페이지 새로고침 / 닫기 방지
  useEffect(() => {
    if (!open || step === "idle" || step === "success") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [open, step]);

  const stepsList = [
    {
      key: "compressing",
      label: "이미지 용량 최적화 (압축)",
    },
    {
      key: "uploading",
      label: `이미지 스토리지 업로드 (${progress}%)`,
    },
    {
      key: "submitting",
      label: isEdit ? "게시글 수정 완료 처리" : "게시글 생성 및 저장",
    },
  ];

  const getStepStatus = (itemKey: string) => {
    const order = ["compressing", "uploading", "submitting", "success"];
    const currentIndex = order.indexOf(step);
    const itemIndex = order.indexOf(itemKey);

    if (currentIndex > itemIndex || step === "success") return "completed";
    if (currentIndex === itemIndex) return "active";
    return "pending";
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-primary/20 shadow-2xl [&>button]:hidden">
        <DialogHeader className="text-center sm:text-center space-y-2">
          <DialogTitle className="text-xl font-bold">
            {isEdit ? "판매글 수정 진행 중" : "판매글 등록 진행 중"}
          </DialogTitle>
          <DialogDescription>
            {step === "success"
              ? "처리가 완료되었습니다! 페이지를 이동합니다."
              : "안전하게 게시글을 처리 중입니다. 창을 닫지 마세요."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 전체 프로그레스 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>진행률</span>
              <span>{Math.min(100, Math.max(0, progress))}%</span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>

          {/* 단계별 가이드 리스트 */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
            {stepsList.map((item) => {
              const status = getStepStatus(item.key);
              return (
                <div
                  key={item.key}
                  className="flex items-center gap-3 text-sm transition-colors"
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : status === "active" ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span
                    className={
                      status === "completed"
                        ? "text-foreground font-medium line-through opacity-80"
                        : status === "active"
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
