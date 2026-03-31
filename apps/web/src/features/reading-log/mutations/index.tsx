import { useCreateReadingLogMutation as useSharedCreateReadingLogMutation, useDeleteReadingLogMutation as useSharedDeleteReadingLogMutation, useUpdateReadingLogMutation as useSharedUpdateReadingLogMutation, useUpdateReadingLogSettingsMutation as useSharedUpdateReadingLogSettingsMutation } from "@bookjeok/react-query";
import { toast } from "sonner";

import { privateAxios } from "@/shared/libs/axios";

/**
 * 독서 기록 생성 뮤테이션 훅
 */
export const useCreateReadingLogMutation = () => {
  return useSharedCreateReadingLogMutation(privateAxios, {
    onSuccess: () => {
      toast.success("독서 기록이 등록되었습니다.");
    },
    onError: () => {
      toast.error("독서 기록 등록에 실패했습니다.");
    },
  });
};

/**
 * 독서 기록 수정 뮤테이션 훅
 */
export const useUpdateReadingLogMutation = () => {
  return useSharedUpdateReadingLogMutation(privateAxios, {
    onSuccess: () => {
      toast.success("독서 기록이 수정되었습니다.");
    },
    onError: () => {
      toast.error("독서 기록 수정에 실패했습니다.");
    },
  });
};

/**
 * 독서 기록 삭제 뮤테이션 훅
 */
export const useDeleteReadingLogMutation = () => {
  return useSharedDeleteReadingLogMutation(privateAxios, {
    onSuccess: () => {
       toast.success("독서 기록이 삭제되었습니다.");
    },
    onError: () => {
      toast.error("독서 기록 삭제에 실패했습니다.");
    },
  });
};

/**
 * 독서 기록 설정 수정 뮤테이션 훅
 */
export const useUpdateReadingLogSettingsMutation = () => {
  return useSharedUpdateReadingLogSettingsMutation(privateAxios, {
    onSuccess: () => {
      toast.success("독서 기록 설정이 변경되었습니다.");
    },
  });
};
