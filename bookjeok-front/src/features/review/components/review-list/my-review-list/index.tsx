"use client";

import { useRouter } from "next/navigation";
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
import { PATHS } from "@/shared/constants/paths";

import { ReviewGridList } from "../review-grid-list";

export const MyReviewList = () => {
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
            <AlertDialogTitle>리뷰 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 리뷰를 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>삭제</AlertDialogAction>
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
            <AlertDialogTitle>리뷰 수정</AlertDialogTitle>
            <AlertDialogDescription>
              리뷰를 수정하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEdit}>
              수정하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
