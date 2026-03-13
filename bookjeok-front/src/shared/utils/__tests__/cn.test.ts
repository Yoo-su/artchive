import { describe, expect, it } from "vitest";

import { cn } from "@/shared/utils/cn";

describe("cn (클래스명 병합 유틸리티)", () => {
  it("단일 클래스를 반환한다", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("여러 클래스를 병합한다", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("falsy 값을 무시한다", () => {
    expect(cn("text-red-500", false, null, undefined, "bg-blue-500")).toBe(
      "text-red-500 bg-blue-500",
    );
  });

  it("조건부 클래스를 처리한다", () => {
    const isActive = true;
    const isDisabled = false;

    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active",
    );
  });

  it("Tailwind 클래스 충돌 시 마지막 값을 우선한다", () => {
    // tw-merge가 충돌하는 클래스를 해결해야 함
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("빈 인자를 처리한다", () => {
    expect(cn()).toBe("");
  });
});
