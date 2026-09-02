"use client";

// dompurify는 브라우저 DOM에 의존해 서버에서는 sanitize가 정의되지 않습니다.
// 그대로 두면 서버 렌더링 중 예외가 나면서 리뷰 상세 본문이 통째로 비어
// 검색엔진에 빈 페이지로 전달되므로, 서버/클라이언트 양쪽에서 동작하는
// isomorphic-dompurify를 사용합니다.
import DOMPurify from "isomorphic-dompurify";

interface ReviewDetailContentProps {
  content: string;
}

export function ReviewDetailContent({ content }: ReviewDetailContentProps) {
  // XSS 공격 방지를 위해 HTML 콘텐츠를 sanitize 처리
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div
      className="prose prose-stone prose-lg md:prose-xl max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-stone-200 prose-blockquote:bg-stone-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
