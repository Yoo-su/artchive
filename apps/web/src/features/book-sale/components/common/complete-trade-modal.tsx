"use client";

import { UsedBookSale } from "@bookjeok/core";
import {
  useCompleteDirectTradeMutation,
  useTradeCandidatesQuery,
} from "@bookjeok/react-query";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/shadcn/avatar";
import { Button } from "@/shared/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/shadcn/dialog";
import { cn } from "@/shared/utils/cn";
import { getProfileImageUrl } from "@/shared/utils/profile-image";

interface CompleteTradeModalProps {
  sale: UsedBookSale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 판매완료로 바꿀 때 "누구와 거래하셨나요?"를 묻는 모달.
 *
 * 상대를 고르면 거래 완료 기록이 남아 양쪽 모두 후기를 쓸 수 있고,
 * 건너뛰면 판매글 상태만 바뀝니다. 서비스 밖에서 알게 된 사람과 거래한
 * 경우를 막지 않기 위해 건너뛰기를 남겨둡니다.
 */
export const CompleteTradeModal = ({
  sale,
  open,
  onOpenChange,
}: CompleteTradeModalProps) => {
  const t = useTranslations("market.complete_trade");

  const [selectedBuyerId, setSelectedBuyerId] = useState<number | null>(
    sale.reservedForUserId ?? null,
  );

  const { data: candidates = [], isLoading } = useTradeCandidatesQuery(
    sale.id,
    { enabled: open },
  );

  const completeMutation = useCompleteDirectTradeMutation({
    onSuccess: ({ completion }) => {
      toast.success(completion ? t("success_with_review") : t("success"));
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const submit = (buyerId: number | null) => {
    const candidate = candidates.find((item) => item.user.id === buyerId);

    completeMutation.mutate({
      saleId: sale.id,
      buyerId: buyerId ?? undefined,
      chatRoomId: candidate?.chatRoomId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-stone-900 dark:text-stone-100">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-xs">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8 text-stone-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : candidates.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-400">
              {t("no_candidates")}
            </p>
          ) : (
            candidates.map((candidate) => {
              const isSelected = selectedBuyerId === candidate.user.id;
              return (
                <button
                  key={candidate.user.id}
                  type="button"
                  onClick={() => setSelectedBuyerId(candidate.user.id)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer",
                    isSelected
                      ? "border-stone-900 bg-stone-50 dark:bg-stone-800 dark:border-stone-100 ring-1 ring-stone-900 dark:ring-stone-100"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900",
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={getProfileImageUrl(
                          candidate.user.profileImageUrl,
                        )}
                        alt={candidate.user.nickname}
                      />
                      <AvatarFallback className="text-xs">
                        {candidate.user.nickname?.[0] ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                      {candidate.user.nickname}
                    </span>
                  </span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-stone-900 dark:text-stone-100 shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => submit(null)}
            disabled={completeMutation.isPending}
          >
            {t("skip")}
          </Button>
          <Button
            onClick={() => submit(selectedBuyerId)}
            disabled={completeMutation.isPending || selectedBuyerId === null}
          >
            {completeMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
