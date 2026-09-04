"use client";

import { TradeMethod } from "@bookjeok/core";
import { useTranslations } from "next-intl";
import type { Control, FieldValues, Path } from "react-hook-form";

import { BoxIcon, TruckFastIcon } from "@/shared/components/icons";
import { Handshake, Lock } from "@/shared/components/icons/iconsax";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/shadcn/form";
import { cn } from "@/shared/utils/cn";

/**
 * 택배 거래는 사업자 등록과 PG 승인이 끝나야 열 수 있다.
 * 그때까지는 선택지를 숨기지 않고 비활성 상태로 노출해, 준비 중인 기능이
 * 있다는 사실 자체는 판매자에게 알린다.
 */
const isDeliveryTradeEnabled =
  process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED === "true";

const OPTIONS = [
  { value: TradeMethod.BOTH, icon: BoxIcon, requiresDelivery: true },
  { value: TradeMethod.DELIVERY_ONLY, icon: TruckFastIcon, requiresDelivery: true },
  { value: TradeMethod.DIRECT_ONLY, icon: Handshake, requiresDelivery: false },
] as const;

interface TradeMethodFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
}

/** 판매글 작성·수정 폼에서 쓰는 거래 방식 선택 필드 */
export const TradeMethodField = <T extends FieldValues>({
  control,
  name,
}: TradeMethodFieldProps<T>) => {
  const t = useTranslations("market.trade_method");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>{t("label")}</FormLabel>
          <FormControl>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OPTIONS.map((option) => {
                const Icon = option.icon;
                const isLocked = option.requiresDelivery && !isDeliveryTradeEnabled;
                const isSelected = field.value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isLocked}
                    aria-disabled={isLocked}
                    title={isLocked ? t("delivery_preparing") : undefined}
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative",
                      isLocked
                        ? "cursor-not-allowed opacity-55 border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40"
                        : isSelected
                          ? "cursor-pointer border-stone-900 bg-stone-50 dark:bg-stone-800 dark:border-stone-100 ring-1 ring-stone-900 dark:ring-stone-100 shadow-2xs"
                          : "cursor-pointer border-stone-200 dark:border-stone-800 bg-card hover:bg-stone-50 dark:hover:bg-stone-900",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-background shadow-2xs">
                        <Icon className="w-4 h-4 text-stone-800 dark:text-stone-200" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">
                        {t(option.value)}
                      </span>
                      {isLocked && (
                        <Lock className="w-3 h-3 text-stone-400 ml-auto shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {isLocked
                        ? t("delivery_preparing")
                        : t(`${option.value}_desc`)}
                    </p>
                  </button>
                );
              })}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
