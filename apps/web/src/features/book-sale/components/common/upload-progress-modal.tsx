"use client";

import { useEffect } from "react";

import {
  LoadingState,
  MultiStepLoader,
} from "@/shared/components/aceternityui/multi-step-loader";

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

  const loadingStates: LoadingState[] = [
    {
      text: "1단계: 이미지 용량 최적화 (압축 중)",
    },
    {
      text: `2단계: 이미지 스토리지 업로드 중 (${Math.min(100, Math.max(0, progress))}%)`,
    },
    {
      text: isEdit
        ? "3단계: 게시글 수정 완료 처리 중"
        : "3단계: 게시글 생성 및 DB 저장 중",
    },
    {
      text: "4단계: 완결! 잠시 후 이동합니다.",
    },
  ];

  const getStepIndex = (currentStep: UploadStep) => {
    switch (currentStep) {
      case "compressing":
        return 0;
      case "uploading":
        return 1;
      case "submitting":
        return 2;
      case "success":
        return 3;
      default:
        return 0;
    }
  };

  const stepIndex = getStepIndex(step);

  return (
    <MultiStepLoader
      loading={open && step !== "idle"}
      value={stepIndex}
      loadingStates={loadingStates}
    />
  );
};
