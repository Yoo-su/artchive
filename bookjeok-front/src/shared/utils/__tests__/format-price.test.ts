import { describe, expect, it } from "vitest";

import { formatPrice } from "@/shared/utils/format-price";

describe("formatPrice (가격 포맷팅 유틸리티)", () => {
  it("한국 원화 형식으로 포맷한다", () => {
    expect(formatPrice(10000)).toBe("₩10,000");
  });

  it("0원을 올바르게 포맷한다", () => {
    expect(formatPrice(0)).toBe("₩0");
  });

  it("큰 금액의 콤마 구분을 올바르게 처리한다", () => {
    expect(formatPrice(1000000)).toBe("₩1,000,000");
  });

  it("소수점이 있는 금액을 처리한다", () => {
    // KRW는 소수점 0자리이므로 반올림됨
    const result = formatPrice(1500.5);
    expect(result).toContain("₩");
  });

  it("음수 금액을 처리한다", () => {
    const result = formatPrice(-5000);
    expect(result).toContain("5,000");
  });
});
