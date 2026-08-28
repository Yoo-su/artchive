"use client";

import { CheckCircle2, Lock } from "lucide-react";
import React from "react";

import { BoxIcon, TruckFastIcon } from "@/shared/components/icons";

export const EscrowInfoCard = () => {
  const steps = [
    {
      icon: Lock,
      title: "1. 대금 안전 보관",
      desc: "결제 금액은 토스페이먼츠 에스크로 금고에 안전하게 보관됩니다.",
    },
    {
      icon: TruckFastIcon,
      title: "2. 안전 택배 발송",
      desc: "판매자가 운송장을 등록하고 택배 배송을 시작합니다.",
    },
    {
      icon: BoxIcon,
      title: "3. 도서 수령 및 검수",
      desc: "책을 안전하게 전달받고 도서 상태를 확인합니다.",
    },
    {
      icon: CheckCircle2,
      title: "4. 구매확정 및 정산",
      desc: "구매확정 시 판매자에게 대금이 최종 정산됩니다.",
    },
  ];

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-600" />
        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          북적 안전결제(에스크로) 보호 시스템
        </h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 p-3 border border-stone-200/60 dark:border-stone-800"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="font-semibold text-stone-900 dark:text-stone-100 block">
                  {s.title}
                </span>
                <p className="text-stone-500 dark:text-stone-400 leading-relaxed text-[11px]">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
