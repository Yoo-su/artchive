"use client";

import { useTranslations } from "next-intl";

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

import { useConfirmStore } from "../stores/confirm-store";

export const ConfirmHost = () => {
  const t = useTranslations("common.confirm");
  const current = useConfirmStore((state) => state.queue[0]);
  const resolveCurrent = useConfirmStore((state) => state.resolveCurrent);

  if (!current) return null;

  const { options } = current;

  const handleConfirm = () => {
    resolveCurrent(true);
  };

  const handleCancel = () => {
    resolveCurrent(false);
  };

  return (
    <AlertDialog
      open={!!current}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif">
            {options.title || t("title")}
          </AlertDialogTitle>
          {options.description && (
            <AlertDialogDescription className="whitespace-pre-line text-stone-600 leading-relaxed">
              {options.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel onClick={handleCancel}>
            {options.cancelText || t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              options.variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white font-medium"
                : "bg-stone-900 hover:bg-stone-850 text-white font-medium"
            }
          >
            {options.confirmText || t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
