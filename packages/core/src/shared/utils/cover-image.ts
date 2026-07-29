/**
 * 알라딘 도서 표지 이미지 URL을 고화질(cover500) 이미지 URL로 변환합니다.
 * @param url 알라딘 API에서 전달받은 커버 이미지 URL
 * @returns 500px 고화질 커버 이미지 URL
 */
export function formatAladinCoverImage(url?: string | null): string {
  if (!url) return "";

  // HTTP -> HTTPS 프로토콜 변환
  let formattedUrl = url.replace(/^http:\/\//i, "https://");

  // coversum, cover200, cover150, cover 등 표지 경로를 cover500으로 교체
  formattedUrl = formattedUrl.replace(/\/cover(sum|\d+)?\//i, "/cover500/");

  return formattedUrl;
}


/**
 * HTML 이스케이프 문자(&lt;, &gt;, &amp;, &quot;, &#39;, &nbsp; 등)를 디코딩하고 HTML 태그를 정제합니다.
 * @param text 정제할 텍스트
 * @returns 디코딩 및 태그 제거된 일반 텍스트
 */
export function cleanHtmlText(text?: string | null): string {
  if (!text) return "";

  let cleaned = text;

  // HTML 태그 제거 및 줄바꿈 처리
  cleaned = cleaned.replace(/<br\s*\/?>/gi, "\n");
  cleaned = cleaned.replace(/<\/p>/gi, "\n");
  cleaned = cleaned.replace(/<[^>]*>/g, "");

  // 주요 HTML Entities 디코딩
  cleaned = cleaned
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ");

  return cleaned.trim();
}

/**
 * 알라딘 Open API 항목에서 상세 설명(fullDescription2 / fullDescription / description2 등)을 안전하게 추출 및 정제합니다.
 * @param item 알라딘 API 도서 항목
 * @returns 정제된 상세 설명 문자열
 */
export function extractAladinDetailedDescription(item: {
  description?: string;
  fullDescription?: string;
  fullDescription2?: string;
}): string {
  const desc = item.fullDescription2 || item.fullDescription || item.description || "";
  return cleanHtmlText(desc);
}
