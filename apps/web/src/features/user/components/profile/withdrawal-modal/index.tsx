"use client";

import { useTranslations } from "next-intl";

import { useWithdrawMutation } from "@/features/user/mutations";
import { Button } from "@/shared/components/shadcn/button";

export const WithdrawalModal = () => {
  const t = useTranslations("my_page.danger_zone");
  const { mutate: withdraw, isPending } = useWithdrawMutation();

  const handleWithdraw = () => {
    if (window.confirm(t("confirm"))) {
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
