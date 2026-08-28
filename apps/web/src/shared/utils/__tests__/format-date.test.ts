import { describe, expect, it } from "vitest";

import { formatDate, formatRelativeTime } from "../format-date";

describe("formatDate", () => {
  const testDate = new Date("2026-08-27T15:30:00.000Z");

  it("ko 로케일에서 dateTime 포맷을 올바르게 변환한다", () => {
    const formatted = formatDate(testDate, "ko", "dateTime");
    // "2026.08.28 00:30" (KST 기준) or matching yyyy.MM.dd HH:mm pattern
    expect(formatted).toMatch(/^\d{4}\.\d{2}\.\d{2} \d{2}:\d{2}$/);
    expect(formatted).not.toContain("오후");
  });

  it("ko 로케일에서 date 포맷을 올바르게 변환한다", () => {
    const formatted = formatDate(testDate, "ko", "date");
    expect(formatted).toMatch(/^\d{4}\.\d{2}\.\d{2}$/);
  });

  it("ko 로케일에서 monthDay 포맷을 올바르게 변환한다", () => {
    const formatted = formatDate(testDate, "ko", "monthDay");
    expect(formatted).toMatch(/^\d{1,2}월 \d{1,2}일$/);
  });

  it("유효하지 않은 날짜가 주어지면 빈 문자열을 반환한다", () => {
    expect(formatDate("invalid-date", "ko", "date")).toBe("");
  });
});

describe("formatRelativeTime", () => {
  it("유효하지 않은 날짜가 주어지면 빈 문자열을 반환한다", () => {
    expect(formatRelativeTime("invalid-date", "ko")).toBe("");
  });
});
