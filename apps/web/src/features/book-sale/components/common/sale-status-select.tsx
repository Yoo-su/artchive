"use client";

import { SaleStatus, UsedBookSale } from "@bookjeok/core";
import { useCancelSaleReservationMutation } from "@bookjeok/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { cn } from "@/shared/utils/cn";

import { useUpdateBookSaleStatusMutation } from "../../mutations";
import { CompleteTradeModal } from "./complete-trade-modal";

interface SaleStatusSelectProps {
  sale: UsedBookSale;
  className?: string;
}

/**
 * 판매자가 판매글 상태(판매중·예약중·판매완료)를 바꾸는 셀렉트.
 *
 * 잠금 판단은 `sale.hasActiveOrder`로만 한다. 예약중 상태를 잠금 근거로
 * 삼으면, 다른 구매희망자의 혼동을 줄이려고 예약중으로 바꾼 직거래 판매자가
 * 판매완료로 넘어갈 수 없게 된다.
 */
export const SaleStatusSelect = ({
  sale,
  className,
}: SaleStatusSelectProps) => {
  const t = useTranslations("market.history");
  const tStatus = useTranslations("market.sale_status");
  const tActions = useTranslations("market.detail.actions");

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  const { mutate: updateSaleStatus, isPending } =
    useUpdateBookSaleStatusMutation();
  const { mutate: cancelReservation, isPending: isCancelling } =
    useCancelSaleReservationMutation();

  const isLocked = sale.hasActiveOrder === true;

  const handleChange = (next: string) => {
    const status = next as SaleStatus;

    // 판매완료는 "누구와 거래했는지"를 물어야 후기를 열 수 있으므로
    // 단순 상태 변경 대신 모달을 띄운다.
    if (status === SaleStatus.SOLD) {
      setIsCompleteModalOpen(true);
      return;
    }

    // 예약을 푸는 경우 거래 상대 지정도 함께 해제해야 다른 채팅방의
    // "거래 진행 중" 안내가 사라진다.
    if (
      status === SaleStatus.FOR_SALE &&
      sale.status === SaleStatus.RESERVED &&
      sale.reservedForUserId
    ) {
      cancelReservation(sale.id);
      return;
    }

    updateSaleStatus({ saleId: sale.id, status });
  };

  return (
    <>
      <Select
        value={sale.status}
        onValueChange={handleChange}
        disabled={isLocked || isPending || isCancelling}
      >
        <SelectTrigger
          className={cn(
            "w-[105px] h-8 text-xs bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 rounded-lg shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed",
            className,
          )}
          title={isLocked ? tActions("in_trade_status_auto") : undefined}
        >
          <SelectValue placeholder={t("change_status")} />
        </SelectTrigger>
        <SelectContent>
          {Object.values(SaleStatus).map((status) => (
            <SelectItem key={status} value={status} className="text-xs">
              {tStatus(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <CompleteTradeModal
        sale={sale}
        open={isCompleteModalOpen}
        onOpenChange={setIsCompleteModalOpen}
      />
    </>
  );
};
