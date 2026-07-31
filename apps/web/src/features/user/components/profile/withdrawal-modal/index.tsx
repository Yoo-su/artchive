"use client";

import { useTranslations } from "next-intl";

import { useConfirm } from "@/features/confirm";
import { useWithdrawMutation } from "@/features/user/mutations";
import { Button } from "@/shared/components/shadcn/button";

export const WithdrawalModal = () => {
  const t = useTranslations("my_page.danger_zone");
  const confirm = useConfirm();
  const { mutate: withdraw, isPending } = useWithdrawMutation();

  const handleWithdraw = async () => {
    const isConfirmed = await confirm({
      title: t("withdraw_button"),
      description: t("confirm"),
      confirmText: t("withdraw_button"),
      variant: "destructive",
    });

    if (isConfirmed) {
      withdraw();
    }
  };

  return (
    <Button
      variant="destructive"
      className="w-full sm:w-auto"
      onClick={handleWithdraw}
      disabled={isPending}
    >
      {isPending ? t("processing") : t("withdraw_button")}
    </Button>
  );
};
