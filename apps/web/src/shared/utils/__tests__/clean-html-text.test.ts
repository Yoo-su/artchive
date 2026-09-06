import { cleanHtmlText } from "@bookjeok/core";
import { describe, expect, it } from "vitest";

describe("cleanHtmlText", () => {
  it("빈 값은 빈 문자열로 돌려준다", () => {
    expect(cleanHtmlText("")).toBe("");
    expect(cleanHtmlText(null)).toBe("");
    expect(cleanHtmlText(undefined)).toBe("");
  });

  it("HTML 태그를 제거한다", () => {
    expect(cleanHtmlText("<b>굵게</b>")).toBe("굵게");
    expect(cleanHtmlText("첫줄<br>둘째줄")).toBe("첫줄\n둘째줄");
  });

  describe("엔티티 디코딩", () => {
    it("이름 있는 엔티티를 푼다", () => {
      expect(cleanHtmlText("&lt;태그&gt;")).toBe("<태그>");
      expect(cleanHtmlText("&rsquo;따옴표&rsquo;")).toBe("’따옴표’");
      expect(cleanHtmlText("가&middot;나")).toBe("가·나");
    });

    it("10진 숫자 엔티티를 푼다", () => {
      // 실제 도서 소개에서 발견된 사례 (U+2027 HYPHENATION POINT)
      expect(cleanHtmlText("번역&#8231;추천")).toBe("번역‧추천");
      expect(cleanHtmlText("&#8226; 항목")).toBe("• 항목");
    });

    it("16진 숫자 엔티티를 푼다", () => {
      expect(cleanHtmlText("&#x2027;")).toBe("‧");
      expect(cleanHtmlText("&#x2014;")).toBe("—");
    });

    it("이중 인코딩된 엔티티를 푼다", () => {
      // 공급처가 &lt;를 한 번 더 인코딩해 보내는 경우가 실제로 있다
      expect(cleanHtmlText("&amp;lt;책제목&amp;gt;")).toBe("<책제목>");
    });

    it("&amp;를 마지막에 처리해 과하게 풀지 않는다", () => {
      expect(cleanHtmlText("A &amp; B")).toBe("A & B");
    });

    it("모르는 엔티티와 범위를 벗어난 코드포인트는 원문을 유지한다", () => {
      expect(cleanHtmlText("&unknown; 유지")).toBe("&unknown; 유지");
      expect(cleanHtmlText("&#999999999; 범위밖")).toBe("&#999999999; 범위밖");
    });

    it("디코딩으로 생긴 꺾쇠는 태그로 오인해 지우지 않는다", () => {
      expect(cleanHtmlText("&lt;개미&gt;를 읽었다")).toBe("<개미>를 읽었다");
    });
  });

  it("연속 줄바꿈을 최대 2개로 줄인다", () => {
    expect(cleanHtmlText("A<br><br><br><br>B")).toBe("A\n\nB");
  });
});
