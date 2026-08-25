"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("market.upload_progress");

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
      text: t("stage1"),
    },
    {
      text: t("stage2", { progress: Math.min(100, Math.max(0, progress)) }),
    },
    {
      text: isEdit ? t("stage3_edit") : t("stage3_create"),
    },
    {
      text: t("stage4"),
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
