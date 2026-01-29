"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useDeleteReviewMutation } from "@/features/review/mutations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/shadcn/alert-dialog";
import { useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { ReviewGridList } from "../review-grid-list";

export const MyReviewList = () => {
  const t = useTranslations("my_reviews");
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { mutateAsync: deleteReviewMutation } = useDeleteReviewMutation();

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [editTargetId, setEditTargetId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push(PATHS.LOGIN);
    }
  }, [user, router]);

  const handleDeleteReview = (id: number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteReviewMutation(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleEditReview = (id: number) => {
    setEditTargetId(id);
  };

  const confirmEdit = () => {
    if (editTargetId) {
      router.push(PATHS.REVIEW_EDIT(editTargetId));
      setEditTargetId(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <ReviewGridList
        userId={user.id}
        searchQuery=""
        category={null}
        clearFilters={() => {}}
        onDeleteReview={handleDeleteReview}
        onEditReview={handleEditReview}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open: boolean) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_modal.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_modal.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete_modal.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t("delete_modal.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 수정 확인 다이얼로그 */}
      <AlertDialog
        open={!!editTargetId}
        onOpenChange={(open: boolean) => !open && setEditTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("edit_modal.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("edit_modal.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("edit_modal.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEdit}>
              {t("edit_modal.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
