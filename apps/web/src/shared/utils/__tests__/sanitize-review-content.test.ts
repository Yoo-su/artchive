import { describe, expect, it } from "vitest";

import { sanitizeReviewContent } from "../sanitize-review-content";

describe("sanitizeReviewContent", () => {
  it("Tiptap 기본 서식 태그를 유지한다", () => {
    const html =
      "<h2>제목</h2><p><strong>굵게</strong> <em>기울임</em> <u>밑줄</u> <s>취소선</s></p>" +
      "<blockquote><p>인용</p></blockquote><ul><li>목록</li></ul><pre><code>code</code></pre><hr>";

    // void 태그만 self-closing 형태로 직렬화된다.
    expect(sanitizeReviewContent(html)).toBe(html.replace("<hr>", "<hr />"));
  });

  it("텍스트 색상/하이라이트/정렬 스타일을 유지한다", () => {
    const html =
      '<p style="text-align: center"><span style="color: #ff0000">빨강</span>' +
      '<mark data-color="#ffff00" style="background-color: #ffff00">형광</mark></p>';

    const result = sanitizeReviewContent(html);

    expect(result).toContain("text-align:center");
    expect(result).toContain("color:#ff0000");
    expect(result).toContain("background-color:#ffff00");
    expect(result).toContain('data-color="#ffff00"');
  });

  it("이미지 리사이즈 속성을 유지한다", () => {
    const html =
      '<img src="https://cdn.example.com/a.png" alt="표지" width="500" ' +
      'containerstyle="width: 500px; height: auto; cursor: pointer;" wrapperstyle="display: flex">';

    const result = sanitizeReviewContent(html);

    expect(result).toContain('src="https://cdn.example.com/a.png"');
    expect(result).toContain('width="500"');
    expect(result).toContain("containerstyle=");
    expect(result).toContain("wrapperstyle=");
  });

  it("script 태그와 이벤트 핸들러를 제거한다", () => {
    const result = sanitizeReviewContent(
      '<p onclick="alert(1)">본문</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
    );

    expect(result).not.toContain("script");
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("onerror");
    expect(result).toContain("<p>본문</p>");
  });

  it("javascript:/data: 스킴 링크를 제거한다", () => {
    const result = sanitizeReviewContent(
      '<a href="javascript:alert(1)">클릭</a>' +
        '<img src="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=">',
    );

    expect(result).not.toContain("javascript:");
    expect(result).not.toContain("data:image");
  });

  it("새 탭 링크에는 opener를 끊는 rel을 강제한다", () => {
    const result = sanitizeReviewContent(
      '<a href="https://example.com" target="_blank">링크</a>',
    );

    expect(result).toContain('rel="noopener noreferrer nofollow"');
  });

  it("허용 목록에 없는 style 속성은 제거한다", () => {
    const result = sanitizeReviewContent(
      '<p style="position: fixed; top: 0; color: #000000">본문</p>',
    );

    expect(result).not.toContain("position");
    expect(result).toContain("color:#000000");
  });
});
