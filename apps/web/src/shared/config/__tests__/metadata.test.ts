import { describe, expect, it } from "vitest";

import { createPageMetadata } from "../metadata";

describe("createPageMetadata (페이지별 메타데이터 생성 헬퍼)", () => {
  it("기본 metadataBase와 오픈 그래프 속성들이 올바르게 반환되어야 한다", () => {
    const meta = createPageMetadata({
      title: "테스트 제목",
      description: "테스트 설명",
      locale: "ko",
      path: "/test-path",
    });

    expect(meta.metadataBase?.toString()).toBe("https://bookjeok.com/");
    expect(meta.title).toBe("테스트 제목");
    expect(meta.description).toBe("테스트 설명");

    // Open Graph 검증
    expect(meta.openGraph).toBeDefined();
    expect(meta.openGraph?.title).toBe("테스트 제목 | 북적");
    expect(meta.openGraph?.description).toBe("테스트 설명");
    expect(meta.openGraph?.images).toEqual(["/logo-og-sketch.png"]);
    expect(meta.openGraph?.siteName).toBe("Bookjeok");
    expect(meta.openGraph?.url).toBe("https://bookjeok.com/ko/test-path");

    // Alternates 검증
    expect(meta.alternates).toBeDefined();
    expect(meta.alternates?.canonical).toBe("/ko/test-path");
    expect(meta.alternates?.languages).toEqual({
      ko: "/ko/test-path",
      en: "/en/test-path",
      "x-default": "/ko/test-path",
    });
  });

  it("커스텀 이미지를 제공하면 오픈 그래프 이미지로 지정되어야 한다", () => {
    const meta = createPageMetadata({
      title: "테스트 제목",
      description: "테스트 설명",
      imageUrl: "https://example.com/custom.png",
      locale: "en",
      path: "test-path",
    });

    expect(meta.openGraph?.images).toEqual(["https://example.com/custom.png"]);
    expect(meta.openGraph?.url).toBe("https://bookjeok.com/en/test-path");
  });
});
