"use client";

import { useCreateReadingLogMutation as useSharedCreateReadingLogMutation, useDeleteReadingLogMutation as useSharedDeleteReadingLogMutation, useUpdateReadingLogMutation as useSharedUpdateReadingLogMutation, useUpdateReadingLogSettingsMutation as useSharedUpdateReadingLogSettingsMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/**
 * 독서 기록 생성 뮤테이션 훅
 */
export const useCreateReadingLogMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedCreateReadingLogMutation({
    onSuccess: () => {
      toast.success(t("create_success"));
    },
    onError: () => {
      toast.error(t("create_error"));
    },
  });
};

/**
 * 독서 기록 수정 뮤테이션 훅
 */
export const useUpdateReadingLogMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedUpdateReadingLogMutation({
    onSuccess: () => {
      toast.success(t("update_success"));
    },
    onError: () => {
      toast.error(t("update_error"));
    },
  });
};

/**
 * 독서 기록 삭제 뮤테이션 훅
 */
export const useDeleteReadingLogMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedDeleteReadingLogMutation({
    onSuccess: () => {
      toast.success(t("delete_success"));
    },
    onError: () => {
      toast.error(t("delete_error"));
    },
  });
};

/**
 * 독서 기록 설정 수정 뮤테이션 훅
 */
export const useUpdateReadingLogSettingsMutation = () => {
  const t = useTranslations("reading_log.toast");
  return useSharedUpdateReadingLogSettingsMutation({
    onSuccess: () => {
      toast.success(t("settings_updated"));
    },
  });
};
