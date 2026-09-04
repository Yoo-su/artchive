import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import {
  AddressInput,
  ShippingAddressFormValues,
} from "../components/address-input";

vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      recipient_name: "수령인 이름",
      recipient_name_placeholder: "수령인 실명을 입력하세요",
      recipient_phone: "연락처",
      recipient_phone_placeholder: "휴대폰 번호를 입력하세요",
      shipping_info: "배송지 정보",
      zip_code: "우편번호",
      search_zip_code: "우편번호 검색",
      address_placeholder: "우편번호 검색을 통해 입력됩니다",
      address_detail: "상세 주소",
      address_detail_placeholder: "동/호수, 건물명 등 상세 주소를 입력하세요",
      delivery_memo: "배송 요청사항 (선택)",
      delivery_memo_placeholder: "배송 시 요청사항을 입력해주세요",
      postcode_modal_title: "주소 검색",
    };
    return map[key] || key;
  },
}));

vi.mock("react-daum-postcode", () => ({
  DaumPostcodeEmbed: () => (
    <div data-testid="daum-postcode-embed">DaumPostcodeEmbed Mock</div>
  ),
}));

describe("AddressInput component", () => {
  const initialValues: ShippingAddressFormValues = {
    recipientName: "홍길동",
    recipientPhone: "010-1234-5678",
    zipCode: "06234",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "101동 1001호",
    deliveryMemo: "문 앞에 놓아주세요",
  };

  it("renders all form inputs with correct values", () => {
    const onChange = vi.fn();
    render(<AddressInput values={initialValues} onChange={onChange} />);

    expect(screen.getByDisplayValue("홍길동")).toBeInTheDocument();
    expect(screen.getByDisplayValue("010-1234-5678")).toBeInTheDocument();
    expect(screen.getByDisplayValue("06234")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("서울특별시 강남구 테헤란로 123"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("101동 1001호")).toBeInTheDocument();
    expect(screen.getByDisplayValue("문 앞에 놓아주세요")).toBeInTheDocument();
  });

  it("formats phone number automatically with hyphens", () => {
    const onChange = vi.fn();
    const emptyValues: ShippingAddressFormValues = {
      recipientName: "",
      recipientPhone: "",
      zipCode: "",
      address: "",
      addressDetail: "",
    };

    render(<AddressInput values={emptyValues} onChange={onChange} />);

    const phoneInput = screen.getByPlaceholderText("휴대폰 번호를 입력하세요");
    fireEvent.change(phoneInput, { target: { value: "01098765432" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientPhone: "010-9876-5432",
      }),
    );
  });

  it("displays error messages when errors prop is provided", () => {
    const onChange = vi.fn();
    const errors = {
      recipientName: "수령인 이름을 입력해주세요.",
      recipientPhone: "올바른 연락처 형식이 아닙니다.",
      address: "배송지 주소를 검색하여 입력해주세요.",
      addressDetail: "상세 주소를 입력해주세요.",
    };

    render(
      <AddressInput
        values={{
          recipientName: "",
          recipientPhone: "",
          zipCode: "",
          address: "",
          addressDetail: "",
        }}
        onChange={onChange}
        errors={errors}
      />,
    );

    expect(screen.getByText("수령인 이름을 입력해주세요.")).toBeInTheDocument();
    expect(
      screen.getByText("올바른 연락처 형식이 아닙니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("배송지 주소를 검색하여 입력해주세요."),
    ).toBeInTheDocument();
    expect(screen.getByText("상세 주소를 입력해주세요.")).toBeInTheDocument();
  });

  it("opens postcode modal when clicking search button", () => {
    const onChange = vi.fn();
    render(<AddressInput values={initialValues} onChange={onChange} />);

    const searchBtn = screen.getByRole("button", { name: /우편번호 검색/i });
    fireEvent.click(searchBtn);

    expect(screen.getByTestId("daum-postcode-embed")).toBeInTheDocument();
  });
});
