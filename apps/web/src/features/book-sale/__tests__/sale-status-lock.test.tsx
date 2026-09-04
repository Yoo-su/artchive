import { SaleStatus, UsedBookSale } from "@bookjeok/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { SaleStatusSelect } from "@/features/book-sale/components/common/sale-status-select";

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: (section?: string) => (key: string) =>
    `${section ? `${section}.` : ""}${key}`,
}));

vi.mock("@/features/book-sale/mutations", () => ({
  useUpdateBookSaleStatusMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

const baseSale = {
  id: 1,
  title: "클린 코드 팝니다",
  price: 15000,
  city: "서울",
  district: "강남구",
  content: "상태 좋아요",
  imageUrls: [],
  status: SaleStatus.RESERVED,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  user: { id: 1, handle: "seller", nickname: "판매자", profileImageUrl: null },
  viewCount: 0,
} as unknown as UsedBookSale;

const renderSelect = (sale: UsedBookSale) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SaleStatusSelect sale={sale} />
    </QueryClientProvider>,
  );

describe("판매글 상태 변경 잠금", () => {
  it("직거래로 예약중인 판매글은 상태를 계속 바꿀 수 있다", () => {
    // 직거래 판매자는 다른 구매희망자의 혼동을 줄이려고 예약중으로 바꾼다.
    // 여기서 잠기면 판매완료로 넘어갈 방법이 없어진다.
    renderSelect({ ...baseSale, hasActiveOrder: false });

    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });

  it("활성 주문이 걸린 판매글만 상태 변경이 잠긴다", () => {
    renderSelect({ ...baseSale, hasActiveOrder: true });

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("잠금 정보가 없는 응답은 잠그지 않는다", () => {
    renderSelect(baseSale);

    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });
});
